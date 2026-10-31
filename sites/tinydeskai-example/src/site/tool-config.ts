/** Public generator metadata, shared by the UI and server without importing the generation prompts. */
export const TOOL_MODEL = {
  id: 'tiny-desk',
  credits: 10,
  slots: [
    { id: 'lead', label: 'Lead vocals', required: false },
    { id: 'sax', label: 'Sax', required: false },
    { id: 'keys', label: 'Keys', required: false },
    { id: 'backLeft', label: 'Backing vocals (left)', required: false },
    { id: 'backRight', label: 'Backing vocals (right)', required: false },
  ],
} as const;
