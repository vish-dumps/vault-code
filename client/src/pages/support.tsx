import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Heart, Instagram, QrCode, Linkedin } from "lucide-react";
import { useState } from "react";

export default function Support() {
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [showCoffeeQr, setShowCoffeeQr] = useState(false);

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Support CodeVault
        </h1>
        <p className="text-muted-foreground">
          Help keep CodeVault running and support future development
        </p>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mt-1" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                Thank You for Your Support!
              </h3>
              <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
                CodeVault is a passion project built to help coders track their journey and celebrate their
                growth. Your support helps cover hosting costs, development time, and enables me to add new
                features and improvements. Every contribution, no matter how small, means the world to me! 💜
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Buy Me a Coffee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-500" />
              Buy Me a Coffee
            </CardTitle>
            <CardDescription>Support via Buy Me a Coffee platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you enjoy using CodeVault and want to support its development, you can buy me a coffee!
              It helps keep me motivated and the servers running.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                onClick={() => window.open("https://buymeacoffee.com/vishwaszsoni", "_blank")}
              >
                <Coffee className="w-4 h-4 mr-2" />
                Buy Me a Coffee
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCoffeeQr(!showCoffeeQr)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showCoffeeQr ? "Hide" : "Show"} QR Code
              </Button>
            </div>
            {showCoffeeQr && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src="/qr-code-buymecofee.png"
                  alt="Buy Me a Coffee QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPI Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500" />
              UPI Payment (India)
            </CardTitle>
            <CardDescription>Direct UPI payment for Indian users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For users in India, you can support directly via UPI. Scan the QR code or use the UPI ID below.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-mono text-center">vishwaszsoni@okicici</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowUpiQr(!showUpiQr)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showUpiQr ? "Hide" : "Show"} UPI QR Code
              </Button>
            </div>
            {showUpiQr && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src="/QRCodeUPI.png"
                  alt="UPI QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connect with Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Connect with the Creator
          </CardTitle>
          <CardDescription>Share your experience and stay updated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            I'd love to hear about your experience with CodeVault! Connect with me on social media to share your
            thoughts, suggestions, or just to say hi. Your feedback and stories make this journey worthwhile!
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              onClick={() => window.open("https://www.instagram.com/ks_soni_14/", "_blank")}
            >
              <Instagram className="w-4 h-4 mr-2" />
              Follow on Instagram
            </Button>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={() => window.open("https://www.linkedin.com/in/vishwas-soni-152952250/", "_blank")}
            >
              <Linkedin className="w-4 h-4 mr-2" />
              Connect on LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Other Ways to Support */}
      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Support</CardTitle>
          <CardDescription>Help CodeVault grow without spending money</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-semibold">Share with Friends</p>
                <p className="text-sm text-muted-foreground">
                  Tell your coding friends about CodeVault and help them track their journey too!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-semibold">Leave Feedback</p>
                <p className="text-sm text-muted-foreground">
                  Share your thoughts and suggestions to help improve CodeVault for everyone.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-semibold">Star on GitHub</p>
                <p className="text-sm text-muted-foreground">
                  If CodeVault is open source, give it a star to show your support!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-semibold">Report Bugs</p>
                <p className="text-sm text-muted-foreground">
                  Help make CodeVault better by reporting any bugs or issues you encounter.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-blue-900 dark:text-blue-100 font-semibold">
              Every contribution helps make CodeVault better! 🚀
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Thank you for being part of this journey and supporting the development of CodeVault.
              Your support means everything!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
