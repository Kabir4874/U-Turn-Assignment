export interface RequestUser {
  userId: number;
  role: string;
  isActive?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  isDeleted?: boolean;
  [key: string]: unknown;
}
