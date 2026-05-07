package com.autoclicker.ui.main

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.autoclicker.model.ClickSpeed

class MainViewModel : ViewModel() {

    private val _speed = MutableLiveData(ClickSpeed.NORMAL)
    val speed: LiveData<ClickSpeed> = _speed

    private val _clickCount = MutableLiveData(100)
    val clickCount: LiveData<Int> = _clickCount

    private val _isInfinite = MutableLiveData(false)
    val isInfinite: LiveData<Boolean> = _isInfinite

    fun setSpeed(speed: ClickSpeed) {
        _speed.value = speed
    }

    fun setClickCount(count: Int) {
        _clickCount.value = count.coerceAtLeast(1)
    }

    fun setInfinite(isInfinite: Boolean) {
        _isInfinite.value = isInfinite
    }
}
