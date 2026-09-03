import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import type { Household, Chore, ProfileName, TaskOwner, TaskStatus, TimeBlock, RoomLocation, TaskFrequency } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function createHousehold(
  householdName: string,
  user: User,
  selectedProfile: ProfileName
): Promise<Household> {
  const syncCode = generateSyncCode();
  const householdRef = doc(collection(db, 'households'));
  const householdId = householdRef.id;

  const newHousehold: Household = {
    id: householdId,
    name: householdName.trim() || `${selectedProfile}'s Tide Sanctuary`,
    syncCode,
    createdAt: Date.now(),
    createdByUid: user.uid,
    createdByName: selectedProfile,
    members: {
      [user.uid]: {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || selectedProfile,
        profileName: selectedProfile,
        joinedAt: Date.now(),
        lastActive: Date.now(),
      },
    },
  };

  await setDoc(householdRef, newHousehold);

  // Update user's profile mapping
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email,
      displayName: user.displayName || selectedProfile,
      profileName: selectedProfile,
      householdId: householdId,
      lastActive: Date.now(),
    },
    { merge: true }
  );

  return newHousehold;
}

export async function findHouseholdBySyncCode(rawCode: string): Promise<Household | null> {
  const cleanCode = rawCode.trim().toUpperCase();
  const q = query(collection(db, 'households'), where('syncCode', '==', cleanCode));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    return null;
  }

  const docSnap = querySnap.docs[0];
  return { ...docSnap.data(), id: docSnap.id } as Household;
}

export async function joinHousehold(
  householdId: string,
  user: User,
  selectedProfile: ProfileName
): Promise<void> {
  const householdRef = doc(db, 'households', householdId);
  const snap = await getDoc(householdRef);

  if (!snap.exists()) {
    throw new Error('Household does not exist.');
  }

  // Update members map
  await updateDoc(householdRef, {
    [`members.${user.uid}`]: {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || selectedProfile,
      profileName: selectedProfile,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    },
  });

  // Update user doc
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email,
      displayName: user.displayName || selectedProfile,
      profileName: selectedProfile,
      householdId: householdId,
      lastActive: Date.now(),
    },
    { merge: true }
  );
}

export function subscribeToHousehold(
  householdId: string,
  onUpdate: (household: Household | null) => void
) {
  const householdRef = doc(db, 'households', householdId);
  return onSnapshot(householdRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate({ ...snapshot.data(), id: snapshot.id } as Household);
    } else {
      onUpdate(null);
    }
  });
}

export function subscribeToChores(
  householdId: string,
  onUpdate: (chores: Chore[]) => void
) {
  const choresRef = collection(db, 'households', householdId, 'chores');
  const q = query(choresRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const chores: Chore[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const timeBlock = (data.timeBlock as TimeBlock) || 'morning';

      // Infer frequency if legacy doc didn't specify
      let frequency: TaskFrequency = 'daily';
      if (data.frequency) {
        frequency = data.frequency as TaskFrequency;
      } else if (timeBlock === 'monthly') {
        frequency = 'monthly_flex';
      } else if (data.dayOfWeek !== undefined && data.dayOfWeek !== 3) {
        frequency = 'specific_day';
      }

      return {
        ...data,
        id: docSnap.id,
        timeBlock,
        room: (data.room as RoomLocation) || 'MISC',
        frequency,
        specificDay: data.specificDay || undefined,
        fiscalWeek: data.fiscalWeek !== undefined ? data.fiscalWeek : 1,
        dayOfWeek: data.dayOfWeek !== undefined ? data.dayOfWeek : 3, // default Thu
        completedBy: data.completedBy || null,
      } as Chore;
    });
    onUpdate(chores);
  });
}

export async function addChore(
  householdId: string,
  data: {
    title: string;
    description?: string;
    owner: TaskOwner;
    status?: TaskStatus;
    timeBlock?: TimeBlock;
    room?: RoomLocation;
    frequency?: TaskFrequency;
    specificDay?: string;
    fiscalWeek?: number;
    dayOfWeek?: number;
    points?: number;
    quadrant?: 'urgent_important' | 'urgent_not_important' | 'not_urgent_important' | 'not_urgent_not_important';
    completedBy?: TaskOwner | null;
  }
): Promise<string> {
  const choresRef = collection(db, 'households', householdId, 'chores');
  const newChoreRef = doc(choresRef);
  const choreId = newChoreRef.id;

  const now = Date.now();
  const timeBlock = data.timeBlock || 'morning';
  const frequency: TaskFrequency = data.frequency || (timeBlock === 'monthly' ? 'monthly_flex' : 'daily');

  const choreDoc: Chore = {
    id: choreId,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    owner: data.owner,
    status: data.status || 'todo',
    timeBlock,
    room: data.room || 'MISC',
    frequency,
    specificDay: data.specificDay || undefined,
    fiscalWeek: data.fiscalWeek !== undefined ? data.fiscalWeek : 1,
    dayOfWeek: data.dayOfWeek !== undefined ? data.dayOfWeek : 3,
    points: data.points || 10,
    quadrant: data.quadrant || 'not_urgent_important',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    completedBy: null,
  };

  await setDoc(newChoreRef, choreDoc);
  return choreId;
}

export async function updateChoreStatus(
  householdId: string,
  choreId: string,
  status: TaskStatus,
  completedBy?: TaskOwner | null
): Promise<void> {
  const choreRef = doc(db, 'households', householdId, 'chores', choreId);
  await updateDoc(choreRef, {
    status,
    updatedAt: Date.now(),
    completedAt: status === 'done' ? Date.now() : null,
    completedBy: status === 'done' ? (completedBy || 'shared') : null,
  });
}

export async function updateChoreOwner(
  householdId: string,
  choreId: string,
  owner: TaskOwner
): Promise<void> {
  const choreRef = doc(db, 'households', householdId, 'chores', choreId);
  await updateDoc(choreRef, {
    owner,
    updatedAt: Date.now(),
  });
}

export async function updateChoreFrequency(
  householdId: string,
  choreId: string,
  frequency: TaskFrequency,
  specificDay?: string
): Promise<void> {
  const choreRef = doc(db, 'households', householdId, 'chores', choreId);
  await updateDoc(choreRef, {
    frequency,
    ...(specificDay !== undefined ? { specificDay } : {}),
    updatedAt: Date.now(),
  });
}

export async function updateChoreRoom(
  householdId: string,
  choreId: string,
  room: RoomLocation
): Promise<void> {
  const choreRef = doc(db, 'households', householdId, 'chores', choreId);
  await updateDoc(choreRef, {
    room,
    updatedAt: Date.now(),
  });
}

export async function updateChoreTimeBlock(
  householdId: string,
  choreId: string,
  timeBlock: TimeBlock
): Promise<void> {
  const choreRef = doc(db, 'households', householdId, 'chores', choreId);
  await updateDoc(choreRef, {
    timeBlock,
    updatedAt: Date.now(),
  });
}

export async function deleteChore(
  householdId: string,
  choreId: string
): Promise<void> {
  const choreRef = doc(db, 'households', householdId, 'chores', choreId);
  await deleteDoc(choreRef);
}

// -------------------------------------------------------------
// PHASE 3: CORE HOUSEHOLD LEDGER & FREQUENCY ENGINE SEED DATA
// -------------------------------------------------------------
export const PHASE_3_CORE_CHORES = [
  // 1. DAILY ROUTINES (e.g., Clean Cat Bowls, Make bed, Wipe down Vanity, Read SW)
  {
    title: 'Clean Cat Bowls',
    description: 'Rinse & sanitize stainless feeding dishes, fill fresh water & wet food for Milo and Louis',
    owner: 'steve' as TaskOwner,
    room: 'Kitchen' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Make bed',
    description: 'Straighten breathable linen sheets, arrange lumbar pillows & smooth duvet',
    owner: 'nicole' as TaskOwner,
    room: 'Bedroom' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Wipe down Vanity',
    description: 'Squeegee quartz counter, polish chrome faucet fixtures & dry splash ring',
    owner: 'shared' as TaskOwner,
    room: 'Bathroom' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Read SW',
    description: 'Star Wars literature reading & quiet evening reflection chapter',
    owner: 'steve' as TaskOwner,
    room: 'Office' as RoomLocation,
    timeBlock: 'evening' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Prep morning espresso & empty dishwasher rack',
    description: 'Pull twin shots, unstack washed ceramics & reset cutlery tray',
    owner: 'steve' as TaskOwner,
    room: 'Kitchen' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Mist sunroom ferns & check soil hydration',
    description: 'Fine spray on staghorn & Boston ferns, calibrate moisture levels',
    owner: 'steve' as TaskOwner,
    room: 'Sunroom' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Clear dining table & wipe table runner',
    description: 'Clean placemats and reset centerpiece for calm dinner atmosphere',
    owner: 'shared' as TaskOwner,
    room: 'Dinning Room' as RoomLocation,
    timeBlock: 'evening' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },
  {
    title: 'Check deadbolts, patio latch & porch night light',
    description: 'Evening sanctuary security walkthrough & ambient dimming',
    owner: 'shared' as TaskOwner,
    room: 'MISC' as RoomLocation,
    timeBlock: 'evening' as TimeBlock,
    frequency: 'daily' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 3,
  },

  // 2. SPECIFIC DAY ASSIGNMENTS (e.g., Run Lomi, Dump Lomi)
  {
    title: 'Run Lomi',
    description: 'Tuesday cycle — Kitchen food scrap composter overnight eco cycle',
    owner: 'steve' as TaskOwner,
    room: 'Kitchen' as RoomLocation,
    timeBlock: 'evening' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Tuesday',
    dayOfWeek: 1, // Tuesday
    fiscalWeek: 1,
  },
  {
    title: 'Dump Lomi',
    description: 'Wednesday morning — Empty cured micro-compost into sunroom nutrient bin',
    owner: 'steve' as TaskOwner,
    room: 'Sunroom' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Wednesday',
    dayOfWeek: 2, // Wednesday
    fiscalWeek: 1,
  },
  {
    title: 'Run Lomi',
    description: 'Friday cycle — Weekend pre-cycle for vegetable peels and espresso pucks',
    owner: 'nicole' as TaskOwner,
    room: 'Kitchen' as RoomLocation,
    timeBlock: 'evening' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Friday',
    dayOfWeek: 4, // Friday
    fiscalWeek: 1,
  },
  {
    title: 'Dump Lomi',
    description: 'Saturday morning — Distribute cured organic matter to sunroom monstera soil',
    owner: 'shared' as TaskOwner,
    room: 'Sunroom' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Saturday',
    dayOfWeek: 5, // Saturday
    fiscalWeek: 1,
  },
  {
    title: 'Deep vacuum living room rugs & upholstered sofa',
    description: 'Saturday morning HEPA vacuum pass across woven wool rug and cushions',
    owner: 'shared' as TaskOwner,
    room: 'Living Room' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Saturday',
    dayOfWeek: 5, // Saturday
    fiscalWeek: 1,
  },
  {
    title: 'Launder bed linens & duvets',
    description: 'Sunday gentle linen cycle wash, sun dry, and smooth bed remake',
    owner: 'nicole' as TaskOwner,
    room: 'Bedroom' as RoomLocation,
    timeBlock: 'morning' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Sunday',
    dayOfWeek: 6, // Sunday
    fiscalWeek: 1,
  },
  {
    title: 'Weekly grocery unbox & dining pantry restock',
    description: 'Sunday evening provisions alignment and spice jar refill',
    owner: 'shared' as TaskOwner,
    room: 'Dinning Room' as RoomLocation,
    timeBlock: 'evening' as TimeBlock,
    frequency: 'specific_day' as TaskFrequency,
    specificDay: 'Sunday',
    dayOfWeek: 6, // Sunday
    fiscalWeek: 1,
  },

  // 3. MONTHLY / FLEX TASKS (e.g., Finance Check in, Change home air filter)
  {
    title: 'Finance Check in',
    description: 'Monthly ledger review, joint household budget, savings targets & investment alignment',
    owner: 'steve' as TaskOwner,
    room: 'Office' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 1,
    dayOfWeek: 5,
  },
  {
    title: 'Change home air filter',
    description: 'Replace central HVAC electrostatic filter unit and wipe intake vents',
    owner: 'shared' as TaskOwner,
    room: 'MISC' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 2,
    dayOfWeek: 5,
  },
  {
    title: 'Descale espresso boiler & sanitize fridge interior',
    description: 'Citric acid flush on espresso machine and wipe crisp glass shelves',
    owner: 'steve' as TaskOwner,
    room: 'Kitchen' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 3,
    dayOfWeek: 5,
  },
  {
    title: 'Wipe dining room crown molding & baseboards',
    description: 'Microfiber dusting and beeswax polish on architectural wood trims',
    owner: 'nicole' as TaskOwner,
    room: 'Dinning Room' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 3,
    dayOfWeek: 6,
  },
  {
    title: 'Scrub ceramic tile grout & descale rain showerhead',
    description: 'Mineral deposit dissolution and deep grout sealing in master bath',
    owner: 'shared' as TaskOwner,
    room: 'Bathroom' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 4,
    dayOfWeek: 6,
  },
  {
    title: 'Deep rotate mattress & steam clean upholstery',
    description: '180-degree rotation on natural latex mattress and steam hygiene pass',
    owner: 'nicole' as TaskOwner,
    room: 'Bedroom' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 4,
    dayOfWeek: 5,
  },
  {
    title: 'Wash sunroom transom glass panes & repot monsteras',
    description: 'Vinegar streak-free glass wash and fresh organic potting soil repotting',
    owner: 'steve' as TaskOwner,
    room: 'Sunroom' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 5,
    dayOfWeek: 5,
  },
  {
    title: 'Archive tax receipts & shred paper records',
    description: 'Digital folder backup, scan accounting receipts and secure document shredding',
    owner: 'steve' as TaskOwner,
    room: 'Office' as RoomLocation,
    timeBlock: 'monthly' as TimeBlock,
    frequency: 'monthly_flex' as TaskFrequency,
    fiscalWeek: 5,
    dayOfWeek: 6,
  },
];

export async function seedInitialHouseholdChores(householdId: string): Promise<void> {
  for (const item of PHASE_3_CORE_CHORES) {
    await addChore(householdId, {
      ...item,
      status: 'todo',
      points: 15,
      quadrant: 'not_urgent_important',
    });
  }
}

export async function resetAndSeedPhase3Ledger(householdId: string): Promise<void> {
  const choresRef = collection(db, 'households', householdId, 'chores');
  const snap = await getDocs(choresRef);
  
  // Delete existing placeholder chores
  const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);

  // Seed core Phase 3 custom ledger
  await seedInitialHouseholdChores(householdId);
}

