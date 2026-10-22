export type ActivityAction =
  | "ADD"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "REGISTER"
  | "IMPORT"
  | "APPROVE"
  | "REJECT";

export type ActivityActor = {
  id: number;
  full_name: string;
  email: string;
};

export type ActivityChange = {
  field: string;
  previous_value: string | null;
  new_value: string | null;
};

export type ActivityLog = {
  id: number;
  performed_by: ActivityActor | null;
  action: ActivityAction;
  module: string;
  record_id: number | null;
  record_label: string;
  changes: ActivityChange[];
  created_at: string;
};

export type ActivityLogFilters = {
  userId: string;
  action: "" | ActivityAction;
  module: string;
  dateFrom: string;
  dateTo: string;
};

export type ActivityLogPage = {
  items: ActivityLog[];
  total: number;
  page: number;
  page_size: number;
  page_count: number;
  filter_options: {
    users: ActivityActor[];
    actions: ActivityAction[];
    modules: string[];
  };
};

export const EMPTY_ACTIVITY_FILTERS: ActivityLogFilters = {
  userId: "",
  action: "",
  module: "",
  dateFrom: "",
  dateTo: "",
};
