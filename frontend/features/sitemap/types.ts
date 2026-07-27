export type SitemapPageInput = {
  alpha: string;
  screen_number: string;
  screen_type: string;
  screen_description: string;
  file_label: string;
  screen_label: string;
  notes: string;
  page_location: string;
};

export type SitemapPage = SitemapPageInput & {
  id: number;
  created_at: string;
  updated_at: string;
};

export type SitemapFormMode = "create" | "view" | "edit";

export type SitemapFilters = {
  alpha: string;
  screenType: string;
  notes: string;
};

export type ToastMessage = {
  type: "success" | "error";
  message: string;
};

export const EMPTY_SITEMAP_PAGE: SitemapPageInput = {
  alpha: "",
  screen_number: "",
  screen_type: "",
  screen_description: "",
  file_label: "",
  screen_label: "",
  notes: "",
  page_location: "",
};

export const EMPTY_SITEMAP_FILTERS: SitemapFilters = {
  alpha: "",
  screenType: "",
  notes: "",
};

export const SITEMAP_PAGE_FIELDS: Array<{
  name: keyof SitemapPageInput;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { name: "alpha", label: "Alpha", placeholder: "e.g. A" },
  {
    name: "screen_number",
    label: "Screen number",
    placeholder: "e.g. 03",
  },
  {
    name: "screen_type",
    label: "Screen type",
    placeholder: "e.g. Dashboard",
  },
  {
    name: "file_label",
    label: "File label",
    placeholder: "e.g. A-03",
  },
  {
    name: "screen_label",
    label: "Screen label",
    placeholder: "e.g. A-03-Dashboard",
  },
  {
    name: "page_location",
    label: "Navigation instructions",
    placeholder: "e.g. Dashboard → Users → Master List",
  },
  {
    name: "screen_description",
    label: "Screen description",
    placeholder: "Describe what this screen is used for",
    multiline: true,
  },
  {
    name: "notes",
    label: "Notes",
    placeholder: "e.g. Active Screen",
    multiline: true,
  },
];
