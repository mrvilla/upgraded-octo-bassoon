import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import "../src/styles/index.css";

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          "Foundations",
          [
            "Introduction",
            "Colors",
            ["Primitives", "Semantic colors", "Component colors"],
            "Dimensions",
            ["Overview"],
            "Architecture",
            ["Token pipeline"],
          ],
        ],
      },
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
      attributeName: "data-theme",
      parentSelector: "html",
    }),
  ],
};

export default preview;
