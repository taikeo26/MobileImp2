export const preloadTemplates = async function (): Promise<unknown> {
  const templatePaths = [
    "modules/mobile-improvements/templates/window-selector.hbs",
    "modules/mobile-improvements/templates/navigation.hbs",
    "modules/mobile-improvements/templates/menu.hbs",
  ];

  return foundry.applications.handlebars.loadTemplates(templatePaths);
};
