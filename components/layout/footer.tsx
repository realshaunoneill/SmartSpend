import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 px-4 py-12 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ReceiptWise" className="h-8 w-auto" />
            <span className="text-xl font-bold text-foreground">ReceiptWise</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/refund" className="transition-colors hover:text-foreground">Refunds</Link>
            <Link href="/support" className="transition-colors hover:text-foreground">Support</Link>
          </div>
        </div>
        <div className="border-t border-border/50 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ReceiptWise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
