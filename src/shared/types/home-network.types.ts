export interface HomeNetwork {
  id: string;
  userId: string;
  displayName: string;
  ssid: string;
  place: string | null;
}

export interface CreateHomeNetworkInput {
  displayName: string;
  ssid: string;
  place?: string | null;
}

export type UpdateHomeNetworkInput = Partial<CreateHomeNetworkInput>;
