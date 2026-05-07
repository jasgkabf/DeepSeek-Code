package com.fastclicker.model

enum class ClickSpeed(val intervalMs: Long, val displayName: String) {
    FAST(100, "极速"),
    NORMAL(300, "标准"),
    SLOW(500, "慢速");

    companion object {
        fun fromInterval(intervalMs: Long): ClickSpeed {
            return entries.find { it.intervalMs == intervalMs } ?: NORMAL
        }
    }
}
