// Business facts shown on the public site.
// `null` renders a visible "To add" placeholder. Replace each with real,
// approved content before a public launch. Never put invented figures here.

export const site = {
  contact: {
    phone: null as string | null, // e.g. "+91 98xxx xxxxx"
    whatsapp: null as string | null, // e.g. "https://wa.me/9198xxxxxxxx"
    email: null as string | null, // e.g. "hello@assetmeet.com"
  },
  fees: {
    business: null as string | null, // e.g. "One month's rent on lease signing"
    owner: null as string | null,
  },
  // e.g. "15% of the fee AssetMeet collects"
  contributorReward: null as string | null,
  // Real clients, closed deals or counts the business may publish.
  proof: null as { label: string; value: string }[] | null,
  // Districts where AssetMeet actively searches today.
  activeDistricts: null as string | null,
};
