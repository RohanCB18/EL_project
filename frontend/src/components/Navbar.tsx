"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="icon-wrap">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-foreground">StudyGenius</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/student"
                            className={`nav-link-student flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                ${pathname === "/student"
                                    ? "bg-primary text-white"
                                    : "text-foreground"
                                }`}
                        >
                            <GraduationCap className="w-4 h-4" />
                            For Students
                        </Link>
                        <Link
                            href="/teacher"
                            className={`nav-link-teacher flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                ${pathname === "/teacher"
                                    ? "bg-accent text-white"
                                    : "text-foreground"
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            For Teachers
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
