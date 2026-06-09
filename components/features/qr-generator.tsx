"use client";

import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, QrCode } from "lucide-react";

export function QrGenerator() {
  const [url, setUrl] = useState("https://barcraft-corvin.hu");
  const [size, setSize] = useState<string>("512");
  const [filename, setFilename] = useState("qr-kod");
  const [borderRadius, setBorderRadius] = useState<number>(50); // Új állapot a lekerekítéshez
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      // Itt fontos megjegyezni, hogy a canvas mentésekor a lekerekítés
      // csak a CSS-ben látszik. Ha a mentett képen is szeretnéd a lekerekítést,
      // ahhoz egy komplexebb canvas rajzolás kellene, de az előnézethez ez a megoldás tökéletes.
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${filename || "qr-kod"}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Card className="w-full dark:bg-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 mb-4">
          <QrCode className="size-8" />
          <h2 className="text-2xl">QR Kód Generáló</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Beállítások */}
          <div className="flex flex-col gap-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Tartalom (URL vagy szöveg)</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-lg md:text-xl leading-8"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Felbontás (px)</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger size="lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 x 256</SelectItem>
                    <SelectItem value="512">512 x 512</SelectItem>
                    <SelectItem value="1024">1024 x 1024</SelectItem>
                    <SelectItem value="2048">2048 x 2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filename">Fájlnév</Label>
                <Input
                  id="filename"
                  placeholder="qr-kod"
                  className="text-lg md:text-xl leading-8"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-1 justify-center items-end">
              <Button
                className="w-full gap-2 text-base"
                onClick={downloadQRCode}
                disabled={!url}
              >
                <Download className="size-6 sm:size-4" />
                Mentés képként
              </Button>
            </div>
          </div>

          {/* Előnézet */}
          <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-6 sm:p-2 bg-transparent min-h-75">
            <div
              ref={qrRef}
              className="p-4 bg-white transition-all duration-200 ease-in-out shadow-lg"
              style={{ borderRadius: `${borderRadius}px`, overflow: "hidden" }}
            >
              <QRCodeCanvas
                value={url || " "}
                size={parseInt(size)}
                level={"H"}
                includeMargin={true}
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "200px",
                }}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground uppercase font-bold">
              Előnézet
            </p>
          </div>
        </div>

        {/* Csúszka a kerekítéshez */}
        {/*<div className="flex justify-end items-center w-full">*/}
        {/*  <div className="flex w-full sm:w-1/2 flex-col items-end gap-1 bg-primary p-2 rounded-md border shadow-sm backdrop-blur-sm">*/}
        {/*    <Label*/}
        {/*      htmlFor="radius-slider"*/}
        {/*      className="text-sm uppercase font-bold text-muted tracking-wide"*/}
        {/*    >*/}
        {/*      Lekerekítés:{" "}*/}
        {/*      <span className="text-primary-foreground">{borderRadius}%</span>*/}
        {/*    </Label>*/}
        {/*    <input*/}
        {/*      id="radius-slider"*/}
        {/*      type="range"*/}
        {/*      min="0"*/}
        {/*      max="100"*/}
        {/*      value={borderRadius}*/}
        {/*      onChange={(e) => setBorderRadius(parseInt(e.target.value))}*/}
        {/*      className="w-full h-5 sm:h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</div>*/}
      </CardContent>
    </Card>
  );
}
