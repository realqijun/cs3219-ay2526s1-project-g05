import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useCollaborationSession } from "@/context/CollaborationSessionContext";
import { useEffect } from "react";
import { collaborationApi } from "@/lib/collaborationApi";
import Markdown from "react-markdown";
import { toast } from "sonner";

export default function AIPanel({ setDisplayAIPanel }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const { session } = useCollaborationSession();

  const handleExplainCode = async () => {
    setLoading(true);
    try {
      console.log(session);
      const response = await collaborationApi.explainCode(session?.id);
      setExplanation(response.explanation);
    } catch (e) {
      toast.error("Failed to get code explanation from AI.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    // handleExplainCode();
  }, [session]);

  return (
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none">
      <CardHeader className="border-b !h-20">
        <div className="w-full flex justify-between items-center">
          <span className="text-xl font-semibold tracking-wider">
            AI Explanation
          </span>
          <Button
            onClick={() => {
              setDisplayAIPanel(false);
              setLoading(false);
            }}
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {false ? (
            <div className="flex flex-col items-center">
              <h1 className="text-xl tracking-wider">Explaining Code...</h1>
              <Loader2 className="w-12 h-12 mt-4 text-primary animate-spin" />
            </div>
          ) : (
            <Markdown>
              {
                "Here's a clear, efficient approach and a ready-to-use Python implementation.\n\nIdea:\n- Build a frequency map (multiset) for the smaller array.\n- Iterate through the larger array, and for each value that exists in the map with positive count, append it to the result and decrement the count.\n- This yields the intersection counting duplicates appropriately, in O(n + m) time and O(min(n, m)) extra space.\n\nWhy this works:\n- Each element in the result is present in both arrays as many times as it appears in both.\n- By always counting from the smaller array, we minimize extra space.\n\nAlgorithm steps:\n1. If nums1 is longer than nums2, swap them (so we count from the smaller one).\n2. Build a dict counts of nums1.\n3. For each x in nums2, if counts[x] > 0, append x to result and decrement counts[x].\n4. Return the result.\n\nPython implementation:\n\nclass Solution:\n    def intersect(self, nums1: List[int], nums2: List[int]) -> List[int]:\n        # Ensure we build the frequency map from the smaller array\n        if len(nums1) > len(nums2):\n            nums1, nums2 = nums2, nums1\n\n        counts = {}\n        for x in nums1:\n            counts[x] = counts.get(x, 0) + 1\n\n        res = []\n        for y in nums2:\n            if counts.get(y, 0) > 0:\n                res.append(y)\n                counts[y] -= 1\n\n        return res\n\nNotes and alternatives:\n- Counter version (more concise, same logic):\n  from collections import Counter\n\n  class Solution:\n      def intersect(self, nums1: List[int], nums2: List[int]) -> List[int]:\n          if len(nums1) > len(nums2):\n              nums1, nums2 = nums2, nums1\n          c = Counter(nums1)\n          res = []\n          for n in nums2:\n              if c[n] > 0:\n                  res.append(n)\n                  c[n] -= 1\n          return res\n\nFollow-up insights:\n- If both arrays are already sorted:\n  - Use two pointers i, j starting at 0; advance the pointer with the smaller value, and when equal, append to result and move both pointers. This is O(n + m) time and O(1) extra space.\n- If nums1 is much smaller than nums2:\n  - The described approach (build map from the smaller array) is optimal in terms of space usage.\n"
              }
            </Markdown>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
