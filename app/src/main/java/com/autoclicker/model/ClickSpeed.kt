package com.autoclicker.model

enum class ClickSpeed(val intervalMs: Long, val displayName: String) {
    FAST(100, "快速"),
    NORMAL(300, "正常"),
    SLOW(500, "慢速");

    companion object {
        fun fromInterval(intervalMs: Long): ClickSpeed {
            return entries.find { it.intervalMs == intervalMs } ?: NORMAL
        }
    }
}
