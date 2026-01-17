"use client";

import { useEffect, useState } from "react";
import { Bell, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const CURRENT_USN = "1RV15CS001"; // temp


export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    if (!open) return;

    const fetchNotifications = async () => {
      const res = await fetch(
        `http://localhost:5000/api/notifications/student/${CURRENT_USN}`
      );
      const data = await res.json();
      setNotifications(data);
    };

    fetchNotifications();
  }, [open]);

  const openProfile = async (senderUSN: string) => {
    const res = await fetch(
      `http://localhost:5000/api/student/${senderUSN}`
    );
    const data = await res.json();
    setSelectedStudent(data);
  };

  const markAsRead = async (notificationId: number) => {
  try {
    await fetch(
      `http://localhost:5000/api/notifications/${notificationId}/read`,
      { method: "PATCH" }
    );
    

    // Update local state so UI reflects change instantly
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId
          ? { ...n, is_read: true }
          : n
      )
    );
  } catch (err) {
    console.error("Failed to mark notification as read", err);
  }
};

const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* 🔔 Bell Icon */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
)}

      </Button>

      {/* Notifications Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Card
  key={n.notification_id}
  className={n.is_read ? "opacity-60 bg-muted" : ""}
>

                    
                  <CardContent className="p-4 flex justify-between items-center">
                    <p className="text-sm">{n.message}</p>
                    <Button
  size="sm"
  variant="outline"
  onClick={() => {
    markAsRead(n.notification_id);
    openProfile(n.sender_id);
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
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="grid gap-4 text-sm">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <p>Name: {selectedStudent.name}</p>
                  <p>USN: {selectedStudent.usn}</p>
                  <p>Email: {selectedStudent.rvce_email}</p>
                  <p>Gender: {selectedStudent.gender}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Academic Information</h4>
                  <p>Branch: {selectedStudent.branch}</p>
                  <p>Year: {selectedStudent.year}</p>
                  <p>Section: {selectedStudent.section}</p>
                  <p>Average EL Marks: {selectedStudent.average_el_marks}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Technical Profile</h4>
                  <p>Languages: {selectedStudent.programming_languages?.join(", ")}</p>
                  <p>Skills: {selectedStudent.tech_skills?.join(", ")}</p>
                  <p>Domains: {selectedStudent.domain_interests?.join(", ")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Projects & Preferences</h4>
                  <p>Past Projects: {selectedStudent.past_projects}</p>
                  <p>Hackathon Count: {selectedStudent.hackathon_participation_count}</p>
                  <p>Achievement: {selectedStudent.hackathon_achievement_level}</p>
                  <p>Work Style: {selectedStudent.project_completion_approach}</p>
                  <p>Commitment: {selectedStudent.commitment_preference}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
