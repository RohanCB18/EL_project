"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function FindTeammates() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔴 TEMP: hardcoded logged-in USN
  const usn = "1RV15CS001";

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/matchmaking/student/${usn}/students`
        );

        if (!res.ok) throw new Error("Failed to fetch matches");

        const data = await res.json();
        setMatches(data);
      } catch (err) {
        console.error(err);
        setError("Could not load teammate matches");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return { bg: "bg-success/10", text: "text-success", border: "border-success/30" };
    if (score >= 60)
      return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" };
    return { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" };
  };

  if (loading) {
    return <p className="p-8">Loading teammate matches...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-500">{error}</p>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Find EL Teammates
        </h2>
        <p className="text-muted-foreground mt-1">
          Students matched based on skills, interests, and work style
        </p>
      </div>

      {matches.length === 0 && (
        <p className="text-muted-foreground">No suitable teammates found.</p>
      )}

      <div className="grid gap-4">
        {matches.map((match, idx) => {
          const colors = getMatchColor(match.match_score);

          return (
            <Card
              key={idx}
              className={`border-2 ${colors.border} hover:shadow-xl transition`}
            >
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16">
                    <AvatarFallback
                      className={`${colors.bg} ${colors.text} font-bold text-lg`}
                    >
                      {match.target_id.slice(-3)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold">
                          USN: {match.target_id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Compatibility based on profile similarity
                        </p>
                      </div>

                      <div
                        className={`px-4 py-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        <p className="text-2xl font-bold">
                          {match.match_score}%
                        </p>
                        <p className="text-xs text-center">Match</p>
                      </div>
                    </div>

                    {/* Match reasons */}
                    <ul className="list-disc ml-5 text-sm text-muted-foreground mb-4">
                      {match.match_reason.map((reason: string, i: number) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button className="flex-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
