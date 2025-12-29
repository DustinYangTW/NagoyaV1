
export enum Category {
  HUB = 'hub',
  TRANSPORT = 'transport',
  ACTIVITY = 'activity',
  FOOD = 'food',
  LOGISTICS = 'logistics',
  SCOUTING = 'scouting'
}

export interface Expense {
  id: string;
  item: string;
  amount: number;
}

export interface FlightInfo {
  flightNumber: string;
  confirmationCode?: string;
  origin: string;
  destination: string;
  arrivalTime?: string;
  passengerNames?: string[];
  class?: string;
  duration?: string;
}

export interface TravelCard {
  id: string;
  day: number;
  time: string;
  endTime?: string;
  title: string;
  subTitle?: string;
  description?: string;
  category: Category;
  locationKeyword?: string;
  isDeleted: boolean;
  expenses: Expense[];
  notes: string[];
  imageUrl?: string;
  flightInfo?: FlightInfo;
}

export interface ItineraryState {
  cards: TravelCard[];
  activeDay: number;
}
