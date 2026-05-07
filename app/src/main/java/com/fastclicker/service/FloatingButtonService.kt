package com.fastclicker.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.graphics.PointF
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import com.fastclicker.R
import com.fastclicker.model.ClickConfig
import com.fastclicker.model.ClickSpeed

class FloatingButtonService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var buttonContainer: FrameLayout? = null
    private var buttonImage: ImageView? = null
    private var isRunning = false
    private var isSelectingPosition = false
    private var clickConfig: ClickConfig = ClickConfig.DEFAULT
    private var targetPosition: PointF? = null

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var lastClickTime = 0L
    private var longPressHandler: Handler? = null
    private var isLongPressDetected = false

    companion object {
        const val CHANNEL_ID = "floating_button_channel"
        const val NOTIFICATION_ID = 1

        const val ACTION_START = "com.fastclicker.action.START"
        const val ACTION_STOP = "com.fastclicker.action.STOP"
        const val ACTION_UPDATE_CONFIG = "com.fastclicker.action.UPDATE_CONFIG"

        const val EXTRA_CLICK_SPEED = "click_speed"
        const val EXTRA_CLICK_COUNT = "click_count"
        const val EXTRA_IS_INFINITE = "is_infinite"

        private const val LONG_PRESS_DELAY = 500L

        private var instance: FloatingButtonService? = null

        fun getInstance(): FloatingButtonService? = instance
        fun isRunning(): Boolean = instance != null
        fun getTargetPosition(): PointF? = instance?.targetPosition
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        longPressHandler = Handler(Looper.getMainLooper())
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
        longPressHandler?.removeCallbacksAndMessages(null)
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
            .setContentText(
                when {
                    isSelectingPosition -> getString(R.string.status_select_position)
                    isRunning -> getString(R.string.status_running)
                    else -> getString(R.string.status_stopped)
                }
            )
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    @SuppressLint("ClickableViewAccessibility")
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
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
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
        val container = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

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
                    isLongPressDetected = false

                    if (!isSelectingPosition) {
                        longPressHandler?.postDelayed({
                            if (!isRunning) {
                                enterPositionSelectMode()
                            }
                        }, LONG_PRESS_DELAY)
                    }
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = Math.abs(event.rawX - initialTouchX)
                    val dy = Math.abs(event.rawY - initialTouchY)

                    if (dx > 10 || dy > 10) {
                        longPressHandler?.removeCallbacksAndMessages(null)
                    }

                    if (!isSelectingPosition) {
                        val params = getLayoutParams() ?: return@setOnTouchListener true
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(floatingView, params)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    longPressHandler?.removeCallbacksAndMessages(null)

                    if (isSelectingPosition) {
                        val x = event.rawX
                        val y = event.rawY
                        setTargetPosition(x, y)
                        exitPositionSelectMode()
                    } else {
                        val dx = Math.abs(event.rawX - initialTouchX)
                        val dy = Math.abs(event.rawY - initialTouchY)

                        if (dx < 15 && dy < 15) {
                            onButtonClick()
                        } else {
                            saveButtonPosition()
                        }
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

    private fun enterPositionSelectMode() {
        isSelectingPosition = true
        buttonImage?.let { btn ->
            btn.setImageResource(R.drawable.ic_target)
            btn.isSelected = true
        }

        updateNotification()
    }

    private fun exitPositionSelectMode() {
        isSelectingPosition = false
        buttonImage?.let { btn ->
            btn.setImageResource(if (isRunning) R.drawable.ic_stop else R.drawable.ic_play)
            btn.isSelected = false
            btn.isActivated = isRunning
        }

        updateNotification()
    }

    private fun setTargetPosition(x: Float, y: Float) {
        targetPosition = PointF(x, y)

        clickConfig = clickConfig.copy(
            targetX = x,
            targetY = y
        )

        updateNotification()
    }

    private fun clearTargetPosition() {
        targetPosition = null
        clickConfig = clickConfig.copy(
            targetX = 0f,
            targetY = 0f
        )
    }

    private fun onButtonClick() {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastClickTime < 300) return
        lastClickTime = currentTime

        if (isSelectingPosition) {
            exitPositionSelectMode()
            return
        }

        val autoClickService = AutoClickService.getInstance()
        if (autoClickService != null) {
            isRunning = autoClickService.toggleClicking(clickConfig)
            updateButtonState()
            updateNotification()
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
            btn.isSelected = false
        }
    }

    private fun updateNotification() {
        val notification = createNotification()
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
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
        isSelectingPosition = false
    }
}
