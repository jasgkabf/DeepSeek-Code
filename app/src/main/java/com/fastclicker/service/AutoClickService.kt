package com.fastclicker.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import com.fastclicker.model.ClickConfig
import com.fastclicker.model.ClickSpeed

class AutoClickService : AccessibilityService() {

    private var isClicking = false
    private var clickConfig: ClickConfig = ClickConfig.DEFAULT
    private var clickCount = 0
    private val handler = Handler(Looper.getMainLooper())

    private val clickRunnable = object : Runnable {
        override fun run() {
            if (!isClicking) return

            if (!clickConfig.isInfinite && clickCount >= clickConfig.clickCount) {
                stopClicking()
                return
            }

            performClick()
            clickCount++

            handler.postDelayed(this, clickConfig.getIntervalMs())
        }
    }

    companion object {
        private var instance: AutoClickService? = null

        fun getInstance(): AutoClickService? = instance

        fun isServiceEnabled(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    }

    override fun onInterrupt() {
    }

    override fun onDestroy() {
        super.onDestroy()
        stopClicking()
        instance = null
    }

    fun startClicking(config: ClickConfig) {
        if (isClicking) return

        this.clickConfig = config
        this.clickCount = 0
        this.isClicking = true

        handler.post(clickRunnable)
    }

    fun stopClicking() {
        isClicking = false
        handler.removeCallbacks(clickRunnable)
        clickCount = 0
    }

    fun toggleClicking(config: ClickConfig): Boolean {
        return if (isClicking) {
            stopClicking()
            false
        } else {
            startClicking(config)
            true
        }
    }

    fun isClicking(): Boolean = isClicking

    fun getCurrentCount(): Int = clickCount

    private fun performClick() {
        val x = if (clickConfig.hasValidTarget()) clickConfig.targetX else getScreenCenterX()
        val y = if (clickConfig.hasValidTarget()) clickConfig.targetY else getScreenCenterY()

        val path = Path().apply {
            moveTo(x, y)
        }

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 10))
            .build()

        dispatchGesture(gesture, null, null)
    }

    private fun getScreenCenterX(): Float {
        return resources.displayMetrics.widthPixels / 2f
    }

    private fun getScreenCenterY(): Float {
        return resources.displayMetrics.heightPixels / 2f
    }
}
