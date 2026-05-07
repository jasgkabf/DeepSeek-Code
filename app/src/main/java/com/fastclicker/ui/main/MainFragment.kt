package com.fastclicker.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.fastclicker.R
import com.fastclicker.databinding.FragmentMainBinding
import com.fastclicker.model.ClickSpeed
import com.fastclicker.service.FloatingButtonService
import com.fastclicker.util.PermissionHelper

class MainFragment : Fragment() {

    private var _binding: FragmentMainBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: MainViewModel

    private val OVERLAY_PERMISSION_REQUEST_CODE = 1001

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMainBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[MainViewModel::class.java]

        setupViews()
        setupObservers()
        checkPermissions()
    }

    private fun setupViews() {
        binding.speedGroup.setOnCheckedChangeListener { _, checkedId ->
            val speed = when (checkedId) {
                R.id.speedFast -> ClickSpeed.FAST
                R.id.speedSlow -> ClickSpeed.SLOW
                else -> ClickSpeed.NORMAL
            }
            viewModel.setSpeed(speed)
        }

        binding.infiniteSwitch.setOnCheckedChangeListener { _, isChecked ->
            viewModel.setInfinite(isChecked)
            binding.countInput.isEnabled = !isChecked
            binding.countInputLayout.isEnabled = !isChecked
        }

        binding.countInput.setOnEditorActionListener { _, _, _ ->
            val count = binding.countInput.text.toString().toIntOrNull() ?: 0
            viewModel.setClickCount(count)
            true
        }

        binding.btnGrantPermission.setOnClickListener {
            handlePermissionRequest()
        }

        binding.btnStartFloating.setOnClickListener {
            startFloatingButton()
        }
    }

    private fun setupObservers() {
        viewModel.speed.observe(viewLifecycleOwner) { speed ->
            val checkedId = when (speed) {
                ClickSpeed.FAST -> R.id.speedFast
                ClickSpeed.SLOW -> R.id.speedSlow
                else -> R.id.speedNormal
            }
            binding.speedGroup.check(checkedId)
        }

        viewModel.isInfinite.observe(viewLifecycleOwner) { isInfinite ->
            binding.infiniteSwitch.isChecked = isInfinite
            binding.countInput.isEnabled = !isInfinite
        }

        viewModel.clickCount.observe(viewLifecycleOwner) { count ->
            if (binding.countInput.text.toString().toIntOrNull() != count) {
                binding.countInput.setText(count.toString())
            }
        }
    }

    private fun checkPermissions() {
        updatePermissionCard()
    }

    private fun updatePermissionCard() {
        val context = requireContext()
        val hasOverlay = PermissionHelper.hasOverlayPermission(context)
        val hasAccessibility = PermissionHelper.hasAccessibilityPermission(context)

        if (hasOverlay && hasAccessibility) {
            binding.permissionCard.visibility = View.GONE
            binding.permissionExplanation.visibility = View.GONE
        } else {
            binding.permissionCard.visibility = View.VISIBLE
            binding.permissionExplanation.visibility = View.VISIBLE

            val message = buildString {
                if (!hasOverlay) {
                    append(getString(R.string.overlay_permission_required))
                }
                if (!hasOverlay && !hasAccessibility) {
                    append("\n")
                }
                if (!hasAccessibility) {
                    append(getString(R.string.accessibility_permission_required))
                }
            }
            binding.permissionMessage.text = message
        }
    }

    private fun handlePermissionRequest() {
        val context = requireContext()

        if (!PermissionHelper.hasOverlayPermission(context)) {
            PermissionHelper.requestOverlayPermission(requireActivity(), OVERLAY_PERMISSION_REQUEST_CODE)
        } else if (!PermissionHelper.hasAccessibilityPermission(context)) {
            PermissionHelper.openAccessibilitySettings(context)
        }
    }

    private fun startFloatingButton() {
        if (!PermissionHelper.hasAllPermissions(requireContext())) {
            updatePermissionCard()
            Toast.makeText(requireContext(), "请先授予必要权限", Toast.LENGTH_SHORT).show()
            return
        }

        val speed = viewModel.speed.value ?: ClickSpeed.NORMAL
        val clickCount = viewModel.clickCount.value ?: 0
        val isInfinite = viewModel.isInfinite.value ?: true

        val intent = Intent(requireContext(), FloatingButtonService::class.java).apply {
            action = FloatingButtonService.ACTION_START
            putExtra(FloatingButtonService.EXTRA_CLICK_SPEED, speed.ordinal)
            putExtra(FloatingButtonService.EXTRA_CLICK_COUNT, clickCount)
            putExtra(FloatingButtonService.EXTRA_IS_INFINITE, isInfinite)
        }

        if (FloatingButtonService.isRunning()) {
            requireContext().stopService(intent)
        }

        requireContext().startForegroundService(intent)

        Toast.makeText(requireContext(), "悬浮按钮已启动\n长按按钮选择点击位置", Toast.LENGTH_SHORT).show()

        requireActivity().moveTaskToBack(true)
    }

    override fun onResume() {
        super.onResume()
        updatePermissionCard()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
