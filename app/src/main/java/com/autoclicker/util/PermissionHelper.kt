package com.autoclicker.util

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.autoclicker.service.AutoClickService

object PermissionHelper {

    fun hasOverlayPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    fun requestOverlayPermission(activity: Activity, requestCode: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${activity.packageName}")
            )
            activity.startActivityForResult(intent, requestCode)
        }
    }

    fun hasAccessibilityPermission(context: Context): Boolean {
        val accessibilityManager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = accessibilityManager.getEnabledAccessibilityServiceList(
            AccessibilityServiceInfo.FEEDBACK_ALL_MASK
        )

        val packageName = context.packageName
        for (service in enabledServices) {
            val enabledServiceInfo = service.resolveInfo.serviceInfo
            if (enabledServiceInfo.packageName == packageName &&
                enabledServiceInfo.name == AutoClickService::class.java.name
            ) {
                return true
            }
        }
        return false
    }

    fun openAccessibilitySettings(context: Context) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun hasAllPermissions(context: Context): Boolean {
        return hasOverlayPermission(context) && hasAccessibilityPermission(context)
    }

    fun getMissingPermissionsDescription(context: Context): List<String> {
        val missing = mutableListOf<String>()

        if (!hasOverlayPermission(context)) {
            missing.add("悬浮窗权限")
        }

        if (!hasAccessibilityPermission(context)) {
            missing.add("无障碍服务权限")
        }

        return missing
    }
}
