'use client';

import { Building2, Phone, Globe, Hash, ExternalLink } from 'lucide-react';

interface ReceiptBusinessDetailsProps {
  ocrData: any
}

export function ReceiptBusinessDetails({ ocrData }: ReceiptBusinessDetailsProps) {
  if (!ocrData?.phoneNumber && !ocrData?.website && !ocrData?.vatNumber) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        <Building2 className="h-4 w-4" />
        Business Details
      </div>
        <div className="grid grid-cols-1 gap-2">
          {ocrData?.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{ocrData.phoneNumber}</span>
            </div>
          )}
          {ocrData?.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={ocrData.website.startsWith('http') ? ocrData.website : `https://${ocrData.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1"
              >
                {ocrData.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {ocrData?.vatNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>VAT: {ocrData.vatNumber}</span>
            </div>
          )}
        </div>
      </div>
  );
}
