package com.autoclicker.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import com.autoclicker.R
import com.autoclicker.model.ClickConfig
import com.autoclicker.model.ClickSpeed

class FloatingButtonService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var buttonContainer: FrameLayout? = null
    private var buttonImage: ImageView? = null
    private var isRunning = false
    private var clickConfig: ClickConfig = ClickConfig.DEFAULT

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var lastClickTime = 0L

    companion object {
        const val CHANNEL_ID = "floating_button_channel"
        const val NOTIFICATION_ID = 1

        const val ACTION_START = "com.autoclicker.action.START"
        const val ACTION_STOP = "com.autoclicker.action.STOP"
        const val ACTION_UPDATE_CONFIG = "com.autoclicker.action.UPDATE_CONFIG"

        const val EXTRA_CLICK_SPEED = "click_speed"
        const val EXTRA_CLICK_COUNT = "click_count"
        const val EXTRA_IS_INFINITE = "is_infinite"

        private var instance: FloatingButtonService? = null

        fun getInstance(): FloatingButtonService? = instance
        fun isRunning(): Boolean = instance != null
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val speedOrdinal = intent.getIntExtra(EXTRA_CLICK_SPEED, ClickSpeed.NORMAL.ordinal)
                val clickCount = intent.getIntExtra(EXTRA_CLICK_COUNT, 0)
                val isInfinite = intent.getBooleanExtra(EXTRA_IS_INFINITE, true)

                clickConfig = ClickConfig(
                    speed = ClickSpeed.entries[speedOrdinal],
                    clickCount = clickCount,
                    isInfinite = isInfinite
                )

                showFloatingButton()
            }
            ACTION_STOP -> {
                hideFloatingButton()
                stopSelf()
            }
            ACTION_UPDATE_CONFIG -> {
                val speedOrdinal = intent.getIntExtra(EXTRA_CLICK_SPEED, ClickSpeed.NORMAL.ordinal)
                val clickCount = intent.getIntExtra(EXTRA_CLICK_COUNT, 0)
                val isInfinite = intent.getBooleanExtra(EXTRA_IS_INFINITE, true)

                clickConfig = ClickConfig(
                    speed = ClickSpeed.entries[speedOrdinal],
                    clickCount = clickCount,
                    isInfinite = isInfinite
                )
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        hideFloatingButton()
        instance = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.app_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "悬浮按钮控制通知"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(if (isRunning) getString(R.string.status_running) else getString(R.string.status_stopped))
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    @SuppressLint("ClickableViewAccessibility", "InflateParams")
    private fun showFloatingButton() {
        if (floatingView != null) return

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = getSharedPreferences("floating_button", Context.MODE_PRIVATE)
                .getInt("position_x", 100)
            y = getSharedPreferences("floating_button", Context.MODE_PRIVATE)
                .getInt("position_y", 200)
        }

        floatingView = createFloatingButtonView()

        windowManager?.addView(floatingView, layoutParams)
    }

    private fun createFloatingButtonView(): View {
        val container = FrameLayout(this)

        buttonImage = ImageView(this).apply {
            setImageResource(R.drawable.ic_play)
            setBackgroundResource(R.drawable.floating_button_background)
            scaleType = ImageView.ScaleType.CENTER
            setPadding(16, 16, 16, 16)
        }

        val buttonSize = resources.getDimensionPixelSize(R.dimen.floating_button_size)
        buttonImage?.layoutParams = FrameLayout.LayoutParams(buttonSize, buttonSize)

        container.addView(buttonImage)
        buttonContainer = container

        setupTouchListener(container)

        return container
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupTouchListener(view: View) {
        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = getLayoutParams()?.x ?: 0
                    initialY = getLayoutParams()?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val params = getLayoutParams() ?: return@setOnTouchListener true
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(floatingView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val dx = Math.abs(event.rawX - initialTouchX)
                    val dy = Math.abs(event.rawY - initialTouchY)

                    if (dx < 10 && dy < 10) {
                        onButtonClick()
                    } else {
                        saveButtonPosition()
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun getLayoutParams(): WindowManager.LayoutParams? {
        return floatingView?.layoutParams as? WindowManager.LayoutParams
    }

    private fun saveButtonPosition() {
        val params = getLayoutParams() ?: return
        getSharedPreferences("floating_button", Context.MODE_PRIVATE)
            .edit()
            .putInt("position_x", params.x)
            .putInt("position_y", params.y)
            .apply()
    }

    private fun onButtonClick() {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastClickTime < 300) return
        lastClickTime = currentTime

        val autoClickService = AutoClickService.getInstance()
        if (autoClickService != null) {
            isRunning = autoClickService.toggleClicking(clickConfig)
            updateButtonState()
        }
    }

    private fun updateButtonState() {
        buttonImage?.let { btn ->
            if (isRunning) {
                btn.setImageResource(R.drawable.ic_stop)
                btn.isActivated = true
            } else {
                btn.setImageResource(R.drawable.ic_play)
                btn.isActivated = false
            }
        }
    }

    private fun hideFloatingButton() {
        floatingView?.let {
            windowManager?.removeViewImmediate(it)
            floatingView = null
            buttonContainer = null
            buttonImage = null
        }

        AutoClickService.getInstance()?.stopClicking()
        isRunning = false
    }
}
