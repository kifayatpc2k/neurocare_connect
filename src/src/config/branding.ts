import collegeLogoPlaceholder from "@/assets/college-logo-placeholder.png";
import universityLogoPlaceholder from "@/assets/university-logo-placeholder.png";

/**
 * CENTRAL BRANDING CONFIGURATION
 * ------------------------------
 * Every institutional name, address, contact detail and logo used anywhere in
 * NeuroCare Connect is read from this file. To rebrand the platform with the
 * official college/university identity, replace the values below (and drop the
 * real logo files into `src/assets/`) — no page or component needs editing.
 */

export type BrandingLogo = {
  /** Imported image source. Swap the import above to replace the asset. */
  src: string;
  alt: string;
  /** Shown while the asset is still an unofficial placeholder. */
  isPlaceholder: boolean;
};

export type BrandingConfig = {
  app: {
    name: string;
    shortName: string;
    tagline: string;
    description: string;
  };
  logos: {
    college: BrandingLogo;
    university: BrandingLogo;
  };
  institution: {
    collegeName: string;
    universityName: string;
    department: string;
    address: string;
    email: string;
    phone: string;
  };
  research: {
    projectTitle: string;
    principalInvestigator: string;
    coordinatorName: string;
    email: string;
    phone: string;
    ethicsReference: string;
  };
  legal: {
    copyrightHolder: string;
  };
};

export const branding: BrandingConfig = {
  app: {
    name: "NeuroCare Connect",
    shortName: "NeuroCare",
    tagline: "Neuropathic Pain Research Platform",
    description: "A Research Study by\nSARHA SHAIKH & ASHMITA S",
  },
  logos: {
    college: {
      src: collegeLogoPlaceholder,
      alt: "College logo placeholder",
      isPlaceholder: true,
    },
    university: {
      src: universityLogoPlaceholder,
      alt: "University logo placeholder",
      isPlaceholder: true,
    },
  },
  institution: {
    collegeName: "[College Name Placeholder]",
    universityName: "[University Name Placeholder]",
    department: "[Department Placeholder]",
    address: "[College Address Placeholder]",
    email: "[contact-email@placeholder]",
    phone: "[Contact Phone Placeholder]",
  },
  research: {
    projectTitle: "[Project Title Placeholder]",
    principalInvestigator: "[Principal Investigator Placeholder]",
    coordinatorName: "[Study Coordinator Placeholder]",
    email: "[research-email@placeholder]",
    phone: "[Research Phone Placeholder]",
    ethicsReference: "[Ethics Approval Reference Placeholder]",
  },
  legal: {
    copyrightHolder: "[Institution Placeholder]",
  },
};
