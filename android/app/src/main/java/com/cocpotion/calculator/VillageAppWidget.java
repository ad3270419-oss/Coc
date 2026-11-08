package com.cocpotion.calculator;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class VillageAppWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "clash_widget_prefs";
    public static final String CAP_PREFS_NAME = "CapacitorStorage";
    public static final String KEY_VILLAGES_DATA = "widget_villages_data";
    public static final String KEY_ACTIVE_INDEX = "widget_active_index";
    public static final String ACTION_SWITCH_WIDGET_ACCOUNT =
        "com.cocpotion.calculator.ACTION_SWITCH_WIDGET_ACCOUNT";

    private static final int[] ROW_IDS = {
        R.id.widget_upgrade_row_1,
        R.id.widget_upgrade_row_2,
        R.id.widget_upgrade_row_3,
        R.id.widget_upgrade_row_4
    };

    private static final int[] TITLE_IDS = {
        R.id.widget_upgrade_title_1,
        R.id.widget_upgrade_title_2,
        R.id.widget_upgrade_title_3,
        R.id.widget_upgrade_title_4
    };

    private static final int[] FINISH_IDS = {
        R.id.widget_upgrade_finish_1,
        R.id.widget_upgrade_finish_2,
        R.id.widget_upgrade_finish_3,
        R.id.widget_upgrade_finish_4
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (appWidgetIds == null) return;
        for (int appWidgetId : appWidgetIds) {
            updateSingleWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (ACTION_SWITCH_WIDGET_ACCOUNT.equals(action)) {
            handleSwitchAccount(context);
        } else if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)) {
            updateAllWidgets(context);
        }
    }

    private static void handleSwitchAccount(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(KEY_VILLAGES_DATA, null);
            if (rawJson == null || rawJson.trim().isEmpty()) {
                SharedPreferences capPrefs = context.getSharedPreferences(CAP_PREFS_NAME, Context.MODE_PRIVATE);
                rawJson = capPrefs.getString(KEY_VILLAGES_DATA, "[]");
            }
            JSONArray villages = new JSONArray(rawJson != null ? rawJson : "[]");
            int totalVillages = villages.length();
            if (totalVillages > 1) {
                int currentIdx = prefs.getInt(KEY_ACTIVE_INDEX, 0);
                int nextIdx = (currentIdx + 1) % totalVillages;
                prefs.edit().putInt(KEY_ACTIVE_INDEX, nextIdx).apply();
            }
        } catch (Exception ignored) {
            // Safe fallback on malformed JSON
        }
        updateAllWidgets(context);
    }

    public static void saveWidgetDataAndRefresh(Context context, String villagesJson, int activeIndex) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            if (villagesJson != null) {
                editor.putString(KEY_VILLAGES_DATA, villagesJson);
            }
            if (activeIndex >= 0) {
                editor.putInt(KEY_ACTIVE_INDEX, activeIndex);
            }
            editor.apply();

            SharedPreferences capPrefs = context.getSharedPreferences(CAP_PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor capEditor = capPrefs.edit();
            if (villagesJson != null) {
                capEditor.putString(KEY_VILLAGES_DATA, villagesJson);
            }
            if (activeIndex >= 0) {
                capEditor.putString(KEY_ACTIVE_INDEX, String.valueOf(activeIndex));
            }
            capEditor.apply();
        } catch (Exception ignored) {
            // Ignore SharedPreferences write failure
        }
        updateAllWidgets(context);
    }

    public static void updateAllWidgets(Context context) {
        if (context == null) return;
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, VillageAppWidget.class);
            int[] widgetIds = manager.getAppWidgetIds(componentName);
            if (widgetIds != null && widgetIds.length > 0) {
                for (int widgetId : widgetIds) {
                    updateSingleWidget(context, manager, widgetId);
                }
            }
        } catch (Exception ignored) {
            // Ignore widget manager error
        }
    }

    public static void updateSingleWidget(
        Context context,
        AppWidgetManager appWidgetManager,
        int appWidgetId
    ) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.village_widget_layout);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // 1. Setup In-Widget Account Switch Broadcast PendingIntent on [ ⇄ ]
        Intent switchIntent = new Intent(context, VillageAppWidget.class);
        switchIntent.setAction(ACTION_SWITCH_WIDGET_ACCOUNT);
        PendingIntent switchPendingIntent = PendingIntent.getBroadcast(
            context,
            101,
            switchIntent,
            pendingFlags
        );
        views.setOnClickPendingIntent(R.id.widget_btn_switch, switchPendingIntent);

        // 2. Setup Deep Link PendingIntent on Root Layout to Launch Clash Planner
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent launchPendingIntent = PendingIntent.getActivity(
            context,
            100,
            launchIntent,
            pendingFlags
        );
        views.setOnClickPendingIntent(R.id.widget_root, launchPendingIntent);

        // 3. Read SharedPreferences data and populate pure TextView hierarchy
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(KEY_VILLAGES_DATA, null);
            int activeIdx = prefs.getInt(KEY_ACTIVE_INDEX, 0);

            if (rawJson == null || rawJson.trim().isEmpty()) {
                SharedPreferences capPrefs = context.getSharedPreferences(CAP_PREFS_NAME, Context.MODE_PRIVATE);
                rawJson = capPrefs.getString(KEY_VILLAGES_DATA, "[]");
                String rawIdxStr = capPrefs.getString(KEY_ACTIVE_INDEX, "0");
                try {
                    activeIdx = Integer.parseInt(rawIdxStr);
                } catch (NumberFormatException ignored) {
                    activeIdx = 0;
                }
            }

            JSONArray villages = new JSONArray(rawJson != null ? rawJson : "[]");
            int total = villages.length();

            if (total == 0) {
                views.setTextViewText(R.id.widget_th_level, "CLASH");
                views.setTextViewText(R.id.widget_player_tag, "#PLANNER");
                views.setTextViewText(R.id.widget_village_name, "No Village Synced");
                views.setTextViewText(R.id.widget_builders_status, "Builders: 0/6 Busy");
                views.setTextViewText(R.id.widget_boost_status, "No Active Boosts");
                views.setTextColor(R.id.widget_boost_status, Color.parseColor("#64748B"));
                views.setTextViewText(R.id.widget_lab_status, "Lab: Idle");
                views.setViewVisibility(R.id.widget_pet_status, View.GONE);
                views.setViewVisibility(R.id.widget_upgrades_empty, View.VISIBLE);
                views.setTextViewText(
                    R.id.widget_upgrades_empty,
                    "Import CoC JSON in Clash Planner to sync widget"
                );
                for (int rowId : ROW_IDS) {
                    views.setViewVisibility(rowId, View.GONE);
                }
                views.setTextViewText(R.id.widget_last_synced, "Synced: --:--");
                appWidgetManager.updateAppWidget(appWidgetId, views);
                return;
            }

            if (activeIdx < 0 || activeIdx >= total) {
                activeIdx = 0;
            }

            JSONObject village = villages.getJSONObject(activeIdx);

            String thLevel = village.optString("thLevel", "TH --");
            String tag = village.optString("tag", "#UNBOUND");
            String villageName = village.optString("name", "Village " + (activeIdx + 1));
            String buildersStatus = village.optString("buildersStatus", "0/6 Busy");
            String boostStatus = village.optString("boostStatus", "No Active Boosts");
            String labStatus = village.optString("labStatus", "Lab: Idle");
            String petStatus = village.optString("petStatus", "");
            String lastSynced = village.optString("lastSynced", "--:--");

            views.setTextViewText(R.id.widget_th_level, thLevel);
            views.setTextViewText(R.id.widget_player_tag, tag);

            String nameWithCount = total > 1
                ? villageName + " (" + (activeIdx + 1) + "/" + total + ")"
                : villageName;
            views.setTextViewText(R.id.widget_village_name, nameWithCount);
            views.setTextViewText(
                R.id.widget_btn_switch,
                total > 1 ? "[ ⇄ " + (activeIdx + 1) + "/" + total + " ]" : "[ ⇄ ]"
            );

            String formattedBuilders = buildersStatus.startsWith("Builders:")
                ? buildersStatus
                : "Builders: " + buildersStatus;
            views.setTextViewText(R.id.widget_builders_status, formattedBuilders);

            views.setTextViewText(R.id.widget_boost_status, boostStatus);
            boolean hasActiveBoost = !boostStatus.equalsIgnoreCase("No Active Boosts")
                && !boostStatus.trim().isEmpty();
            views.setTextColor(
                R.id.widget_boost_status,
                Color.parseColor(hasActiveBoost ? "#F59E0B" : "#64748B")
            );

            String formattedLab = labStatus.startsWith("Lab:")
                ? labStatus
                : "Lab: " + labStatus;
            views.setTextViewText(R.id.widget_lab_status, formattedLab);

            if (petStatus != null
                && !petStatus.trim().isEmpty()
                && !petStatus.equalsIgnoreCase("Idle")
                && !petStatus.equalsIgnoreCase("Pet: Idle")) {
                String formattedPet = petStatus.startsWith("Pet:")
                    ? petStatus
                    : "Pet: " + petStatus;
                views.setTextViewText(R.id.widget_pet_status, formattedPet);
                views.setViewVisibility(R.id.widget_pet_status, View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_pet_status, View.GONE);
            }

            JSONArray upgrades = village.optJSONArray("upgrades");
            int upgradeCount = upgrades != null ? upgrades.length() : 0;

            if (upgradeCount == 0) {
                views.setViewVisibility(R.id.widget_upgrades_empty, View.VISIBLE);
                views.setTextViewText(R.id.widget_upgrades_empty, "All Builders Available");
                for (int rowId : ROW_IDS) {
                    views.setViewVisibility(rowId, View.GONE);
                }
            } else {
                views.setViewVisibility(R.id.widget_upgrades_empty, View.GONE);
                for (int i = 0; i < ROW_IDS.length; i++) {
                    if (i < upgradeCount) {
                        JSONObject upg = upgrades.getJSONObject(i);
                        String upgName = upg.optString("name", "Upgrade");
                        String targetLvl = upg.optString("targetLvl", "");
                        String finishFormatted = upg.optString("finishFormatted", "");

                        String titleLine = !targetLvl.isEmpty()
                            ? upgName + " → " + targetLvl
                            : upgName;
                        String finishLine = finishFormatted.startsWith("Finishes:")
                            ? finishFormatted
                            : "Finishes: " + finishFormatted;

                        views.setTextViewText(TITLE_IDS[i], titleLine);
                        views.setTextViewText(FINISH_IDS[i], finishLine);
                        views.setViewVisibility(ROW_IDS[i], View.VISIBLE);
                    } else {
                        views.setViewVisibility(ROW_IDS[i], View.GONE);
                    }
                }
            }

            String syncedText = lastSynced.startsWith("Synced:")
                ? lastSynced
                : "Synced: " + lastSynced;
            views.setTextViewText(R.id.widget_last_synced, syncedText);

        } catch (Exception e) {
            views.setViewVisibility(R.id.widget_upgrades_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_upgrades_empty, "All Builders Available");
            for (int rowId : ROW_IDS) {
                views.setViewVisibility(rowId, View.GONE);
            }
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
