import { ReactFlowInstance } from "reactflow";
import { AppState, AppStateGetter, AppStateSetter } from "./app-state-types";
import _ from "lodash";
import { getWidgetLibrary } from '../../comfyui-bridge/bridge';
import { Widget } from "../../types";

export default function createHook(set: AppStateSetter, get: AppStateGetter): Partial<AppState> {
  return {
    /**
   * AppStore Initialization Entry 
   */
    onInit: async (editorInstance?: ReactFlowInstance<any, any>) => {
      const widgets = await getWidgetLibrary();
      const widgetCategory = generateWidgetCategories(widgets);
      console.log("widgets", widgets);
      get().subflowStore.getState().setWidgets(widgets);
      set({
        edgeType: localStorage.getItem("edgeType") as any || "bezier",
        widgets,
        widgetCategory
      })
      if (editorInstance) {
        set({
          editorInstance
        })
      }
    },
    onUpdateWidgets: async () => {
      const widgets = await getWidgetLibrary();
      const widgetCategory = generateWidgetCategories(widgets);
      set({
        widgets,
        widgetCategory
      })
    },
  }
}

/**
 * Code generated by GPT
 * @param widgets 
 * @returns 
 */
function generateWidgetCategories(widgets: Record<string, Widget>) {
  const categories = {};

  Object.keys(widgets).forEach((key) => {
    const widget = widgets[key];
    const categoryPath = widget.category.split('/');

    let currentCategory: any = categories;

    categoryPath.forEach((category, index) => {
      if (!currentCategory[category]) {
        currentCategory[category] = {};
      }

      if (index === categoryPath.length - 1) {
        currentCategory[category][key] = widget;
      }

      currentCategory = currentCategory[category];
    });
  });

  return categories;
};

const PINNED_WIDGET_KEY = "pinnedWidgets";
export function getPinnedWidgetsFromLocalStorage(): string[] {
  try {
    const rawData = localStorage.getItem(PINNED_WIDGET_KEY);
    if (rawData) {
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.log("parse pinned widget error", err);
  }
  return []
}

export function setPinnedWidgetsToLocalStorage(pinnedWidgets: string[]) {
  try {
    localStorage.setItem(PINNED_WIDGET_KEY, JSON.stringify(pinnedWidgets));
  } catch (err) {
    console.log("set pinned widget error", err);
  }
}