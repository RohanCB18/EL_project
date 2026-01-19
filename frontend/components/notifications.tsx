"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { API_BASE_URL } from "@/lib/utils";

const BASE_URL = API_BASE_URL;

type RecipientType = "student" | "teacher";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Response is not JSON:", text);
    throw new Error("Server returned non-JSON response");
  }
}

export default function Notifications({
  recipientType,
  recipientId,
  open: controlledOpen,
  setOpen: controlledSetOpen
}: {
  recipientType: RecipientType;
  recipientId: string;

  // ✅ optional (for new dashboard usage)
  open?: boolean;
  setOpen?: (v: boolean) => void;
}) {
  // ---- Backward compatible open state ----
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  const [notifications, setNotifications] = useState<any[]>([]);

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<RecipientType | null>(null);

  // store sender info so we can connect later
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [selectedSenderType, setSelectedSenderType] =
    useState<RecipientType | null>(null);

  // Fetch notifications only when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/notifications/${recipientType}/${recipientId}`
        );

        if (!res.ok) {
          console.error("❌ Failed notifications fetch:", res.status);
          setNotifications([]);
          return;
        }

        const data = await safeJson(res);
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [open, recipientType, recipientId]);

  // Fetch current user profile (student/teacher)
  const fetchMyProfile = async () => {
    const endpoint =
      recipientType === "student"
        ? `${BASE_URL}/api/student/${recipientId}`
        : `${BASE_URL}/api/teacher/${recipientId}`;

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("Failed to fetch my profile");

    return safeJson(res);
  };

  // View profile (student or teacher based on sender_type)
  const openProfile = async (senderType: RecipientType, senderId: string) => {
    try {
      const endpoint =
        senderType === "student"
          ? `${BASE_URL}/api/student/${senderId}`
          : `${BASE_URL}/api/teacher/${senderId}`;

      const res = await fetch(endpoint);

      if (!res.ok) {
        alert("Unable to load profile");
        return;
      }

      const data = await safeJson(res);

      setSelectedType(senderType);
      setSelectedProfile(data);

      setSelectedSenderType(senderType);
      setSelectedSenderId(senderId);
    } catch (err) {
      console.error("Failed to open profile:", err);
      alert("Unable to load profile");
    }
  };

  // Mark notification read
  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PATCH"
      });

      if (!res.ok) {
        console.error("❌ markAsRead failed:", res.status);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  // CONNECT BUTTON LOGIC (mail + notify sender)
  const handleConnect = async () => {
    try {
      if (!selectedProfile || !selectedSenderId || !selectedSenderType) {
        alert("No profile selected");
        return;
      }

      const me = await fetchMyProfile();

      const targetEmail = selectedProfile.rvce_email;
      if (!targetEmail) {
        alert("Email not available for this user");
        return;
      }

      // 1) Send in-app notification to the sender (the person who originally contacted me)
      await fetch(`${BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: selectedSenderType,
          recipient_id: selectedSenderId,
          sender_type: recipientType,
          sender_id: recipientId,
          entity_type: "profile",
          entity_id: recipientId,
          message: `${me.name} would like to work with you and has sent you an email`
        })
      });

      // 2) Open mail draft
      const subject = `EduConnect | Collaboration request from ${me.name}`;

      const body = `
Hi ${selectedProfile.name || ""},

I saw your profile on EduConnect and would like to connect with you.

My details:
Name: ${me.name}
ID: ${recipientId}
Role: ${recipientType.toUpperCase()}

Let’s collaborate!

Regards,
${me.name}
${me.rvce_email || ""}
      `.trim();

      window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    } catch (err) {
      console.error("Connect failed:", err);
      alert("Unable to connect right now");
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  return (
    <>
      {/* ✅ ONLY MODAL (no bell icon here) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {notifications.map((n) => (
                <Card
                  key={n.notification_id}
                  className={n.is_read ? "opacity-60 bg-muted" : ""}
                >
                  <CardContent className="p-4 flex justify-between items-center gap-3">
                    <p className="text-sm flex-1">{n.message}</p>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        markAsRead(n.notification_id);
                        openProfile(n.sender_type, n.sender_id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* PROFILE MODAL */}
      <Dialog
        open={!!selectedProfile}
        onOpenChange={() => {
          setSelectedProfile(null);
          setSelectedType(null);
          setSelectedSenderId(null);
          setSelectedSenderType(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>
                {selectedType === "teacher" ? "Teacher Profile" : "Student Profile"}
              </span>

              <Button onClick={handleConnect}>
                <Mail className="w-4 h-4 mr-2" />
                Connect (Email)
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* STUDENT PROFILE */}
          {selectedProfile && selectedType === "student" && (
            <div className="grid gap-4 text-sm">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <p>Name: {selectedProfile.name}</p>
                  <p>USN: {selectedProfile.usn}</p>
                  <p>Email: {selectedProfile.rvce_email}</p>
                  <p>Gender: {selectedProfile.gender}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Academic Information</h4>
                  <p>Branch: {selectedProfile.branch}</p>
                  <p>Year: {selectedProfile.year}</p>
                  <p>Section: {selectedProfile.section}</p>
                  <p>Average EL Marks: {selectedProfile.average_el_marks}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Technical Profile</h4>
                  <p>
                    Languages: {(selectedProfile.programming_languages || []).join(", ")}
                  </p>
                  <p>Skills: {(selectedProfile.tech_skills || []).join(", ")}</p>
                  <p>
                    Domains: {(selectedProfile.domain_interests || []).join(", ")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TEACHER PROFILE */}
          {selectedProfile && selectedType === "teacher" && (
            <div className="grid gap-4 text-sm">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <p>Name: {selectedProfile.name}</p>
                  <p>Faculty ID: {selectedProfile.faculty_id}</p>
                  <p>Email: {selectedProfile.rvce_email}</p>
                  <p>Department: {selectedProfile.department}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Mentorship Info</h4>
                  <p>Experience: {selectedProfile.years_of_experience} years</p>
                  <p>Mentoring Style: {selectedProfile.mentoring_style || "—"}</p>
                  <p>Max Capacity: {selectedProfile.max_projects_capacity ?? "—"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Expertise</h4>
                  <p>
                    Areas of Expertise:{" "}
                    {(selectedProfile.areas_of_expertise || []).join(", ")}
                  </p>
                  <p>
                    Mentoring Domains:{" "}
                    {(selectedProfile.domains_interested_to_mentor || []).join(", ")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
