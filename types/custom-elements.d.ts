import "react";

/**
 * <signature-intro> is a custom element defined by /public/signature-intro.js,
 * so TypeScript has no idea it exists. Declaring it here keeps the tag typed
 * in JSX instead of needing a cast at the call site.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "signature-intro": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        feel?: "snappy" | "classic" | "weighted";
        color?: string;
        background?: string;
        size?: string;
        speed?: string;
        bounces?: string;
        from?: "left" | "right";
        distance?: string;
        once?: string;
        "home-only"?: string;
        key?: string;
      };
    }
  }
}
