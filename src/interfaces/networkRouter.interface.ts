export interface AddRouterBody {
  host: string;
  user: string;
  password: string;
}

export interface EditRouterBody {
  routerId: number;
  host: string;
  user: string;
  password: string;
}

export interface EditTicketProfileBody {
  profileId: number;
  title: string;
  description?: string;
  bandwidth?: string;
  status?: boolean;
  amount?: number;
}

export interface AddTicketPriceBody {
  profileId: number;
  amount: number;
}

export interface ChangeTicketStatusBody {
  profileId: number;
  status: boolean;
}