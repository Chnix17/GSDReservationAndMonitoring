import React from 'react';
import { Modal, Drawer } from 'antd';
import { useMediaQuery } from 'react-responsive';

/**
 * Responsive View Component
 * Automatically switches between Modal (desktop/tablet) and Drawer (mobile)
 * 
 * Props:
 * - isOpen: boolean - Controls visibility
 * - onClose: function - Close handler
 * - title: string/ReactNode - Modal/Drawer title
 * - children: ReactNode - Content to display
 * - width: number - Desktop modal width (default: 800)
 * - height: string - Mobile drawer height (default: "80%")
 * - placement: string - Drawer placement (default: "bottom")
 * - footer: ReactNode - Footer content (desktop only)
 * - mobileFooter: ReactNode - Mobile-specific footer
 * - ...otherProps - Additional props passed to Modal/Drawer
 */
const ResponsiveView = ({
    isOpen,
    onClose,
    title,
    children,
    width = 800,
    height = "80%",
    placement = "bottom",
    footer = null,
    mobileFooter = null,
    ...otherProps
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    if (isMobile) {
        return (
            <Drawer
                title={title}
                placement={placement}
                height={height}
                open={isOpen}
                onClose={onClose}
                footer={mobileFooter || footer}
                bodyStyle={{ paddingBottom: mobileFooter || footer ? '120px' : '20px' }}
                {...otherProps}
            >
                {children}
            </Drawer>
        );
    }

    return (
        <Modal
            title={title}
            open={isOpen}
            onCancel={onClose}
            width={isTablet ? Math.min(width * 0.9, 700) : width}
            footer={footer}
            {...otherProps}
        >
            {children}
        </Modal>
    );
};

export default ResponsiveView;