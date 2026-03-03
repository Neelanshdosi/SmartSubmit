"use client";
import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const SidebarContext = createContext({ open: false, setOpen: () => { }, animate: true });
const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
    const [openState, setOpenState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = ({ className, children, ...props }) => {
    return (
        <>
            <DesktopSidebar className={className} {...props}>{children}</DesktopSidebar>
            <MobileSidebar className={className} {...props}>{children}</MobileSidebar>
        </>
    );
};

const DesktopSidebar = ({ className, children, ...props }) => {
    const { open, setOpen, animate } = useSidebar();
    return (
        <motion.div
            className={cn(
                "hidden h-full flex-col px-4 py-4 md:flex",
                className
            )}
            style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
            animate={{ width: animate ? (open ? "300px" : "80px") : "300px" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

const MobileSidebar = ({ className, children, ...props }) => {
    const { open, setOpen } = useSidebar();
    return (
        <div
            className={cn("flex h-12 w-full flex-row items-center justify-between px-4 py-4 md:hidden", className)}
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            {...props}
        >
            <div className="flex w-full justify-end">
                <button onClick={() => setOpen(!open)} style={{ color: "rgba(255,255,255,0.7)" }}>
                    ☰
                </button>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={cn("fixed inset-0 z-[100] flex flex-col justify-between p-10")}
                        style={{ background: "#0d0c0d" }}
                    >
                        <button
                            className="absolute right-6 top-6"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                            onClick={() => setOpen(false)}
                        >
                            ✕
                        </button>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const SidebarLink = ({ link, className, ...props }) => {
    const { open, animate } = useSidebar();
    return (
        <a
            href={link.href}
            onClick={link.onClick}
            className={cn("group/sidebar flex items-center gap-2 py-2", className)}
            style={{ textDecoration: "none" }}
            {...props}
        >
            {link.icon}
            <AnimatePresence>
                {(open || !animate) && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15, ease: "easeInOut" }}
                        style={{
                            color: "rgba(255,255,255,0.75)",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                        }}
                    >
                        {link.label}
                    </motion.span>
                )}
            </AnimatePresence>
        </a>
    );
};
