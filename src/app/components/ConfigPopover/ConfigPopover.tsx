import { ConfigPopoverProps } from '@/app/types/ConfigPopoverProps';
import { ConfigPopoverImpl } from '@/app/implementation/configPopover';
import React from 'react';

/**
 * ConfigPopover component
 *
 * A popover component that displays AI configuration options including:
 * - Model vendor selection (ModelSelector)
 * - Specific model selection (ModelDropdown)
 * - API key input (APIKeyInput)
 *
 * This component integrates with AIConfigContext to manage configuration state.
 *
 * @example
 * ```tsx
 * const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
 * const open = Boolean(anchorEl);
 *
 * <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
 *   <Settings />
 * </IconButton>
 *
 * <ConfigPopover
 *   open={open}
 *   onClose={() => setAnchorEl(null)}
 *   anchorEl={anchorEl}
 * />
 * ```
 */
export const ConfigPopover = React.forwardRef<
  HTMLDivElement,
  ConfigPopoverProps
>((props, ref) => {
  return <ConfigPopoverImpl ref={ref} {...props} />;
});

ConfigPopover.displayName = 'ConfigPopover';
