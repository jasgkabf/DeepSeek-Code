package com.fastclicker.model

data class ClickConfig(
    val speed: ClickSpeed = ClickSpeed.NORMAL,
    val clickCount: Int = 0,
    val isInfinite: Boolean = true,
    val targetX: Float = 0f,
    val targetY: Float = 0f
) {
    companion object {
        val DEFAULT = ClickConfig()
    }

    fun getIntervalMs(): Long = speed.intervalMs

    fun hasValidTarget(): Boolean = targetX > 0 && targetY > 0
}
