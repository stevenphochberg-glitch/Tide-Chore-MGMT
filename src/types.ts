export type ProfileName = 'Steve' | 'Nicole';

export type TaskOwner = 'steve' | 'nicole' | 'shared';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TimeBlock = 'morning' | 'evening' | 'monthly';

export type TaskFrequency = 'daily' | 'specific_day' | 'monthly_flex';

export type RoomLocation =
  | 'Bedroom'
  | 'Kitchen'
  | 'Bathroom'
  | 'Living Room'
  | 'Sunroom'
  | 'Office'
  | 'Dinning Room'
  | 'MISC';

export const ROOM_LOCATIONS: RoomLocation[] = [
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Living Room',
  'Sunroom',
  'Office',
  'Dinning Room',
  'MISC',
];

export interface HouseholdMember {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  profileName: ProfileName | string;
  joinedAt: number;
  lastActive: number;
}

export interface Household {
  id: string;
  name: string;
  syncCode: string;
  createdAt: number;
  createdByUid: string;
  createdByName: string;
  members: Record<string, HouseholdMember>;
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  owner: TaskOwner;
  status: TaskStatus;
  timeBlock: TimeBlock;
  room: RoomLocation;
  frequency: TaskFrequency; // 'daily' | 'specific_day' | 'monthly_flex'
  specificDay?: string; // e.g. 'Tuesday', 'Friday', 'Saturday', etc.
  dayOfWeek?: number; // 0 = Mon, 1 = Tue, ..., 6 = Sun
  fiscalWeek?: number; // 1 | 2 | 3 | 4 | 5
  quadrant?: 'urgent_important' | 'urgent_not_important' | 'not_urgent_important' | 'not_urgent_not_important';
  points?: number;
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  completedBy?: TaskOwner | null; // Tracks person who executed the task
}

