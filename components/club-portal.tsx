"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Globe2,
  FileText,
  HandHeart,
  Images,
  LayoutDashboard,
  Leaf,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import AdminDashboard from "./admin-dashboard";
import { ActionModal } from "./action-modal";
import { authClient } from "@/lib/auth-client";

type Donation = {
  id: number;
  donor: string;
  amount: number;
  purpose: string;
  date: string;
  method: string;
  public: boolean;
  status: "Received" | "Verified" | "Pending";
  donorPhotoUrl?: string;
};
type Work = {
  title: string;
  description: string;
  date: string;
  status: "Completed" | "In Progress" | "Pending";
  location: string;
};

const purposes = [
  "Road Cleaning",
  "Poor Family Support",
  "Medical Assistance",
  "Education Support",
  "Sports Program",
  "Cultural Program",
  "Social Awareness Program",
  "Community Tools/Equipment",
  "Youth Development",
  "Environmental/Cleanliness Program",
  "Emergency Support",
  "Club General Fund",
  "Other",
];
const committee = [
  ["Samir Sharki", "अध्यक्ष"],
  ["Yokendra Sharki", "उपाध्यक्ष"],
  ["Payal Sarki", "सचिव"],
  ["Priya Sharki", "सह-सचिव"],
  ["Umesh Sharki", "कोषाध्यक्ष"],
  ["Kapil Sharki", "सह-कोषाध्यक्ष"],
  ["Mahesh Sharki", "खेलकुद संयोजक"],
];
const generalMembers = [
  "Subita",
  "Anish",
  "Dilip",
  "Kuldip",
  "Namita",
  "Anita",
  "Bishal",
  "Batu",
  "Piuli",
  "Manoj",
  "Sachin",
  "Amir",
  "Parbin",
  "Akasha",
  "Bimala",
  "Bipana",
  "Gabbar",
  "Rajendra",
  "Kamala",
  "Nisha",
  "Jhalak",
  "Dipendra",
  "Sarmila",
  "Parmisha",
  "Pardip",
  "Santosh",
  "Sunita",
  "Rabindra",
  "Sarya",
  "Samir",
  "Dhirendra",
  "Birendra",
  "Antim",
  "Laxmi",
  "Dinesh",
  "Ashok",
];
const works: Work[] = [
  {
    title: "गाउँका बाटोहरू सरसफाइ",
    description: "युवा सहभागितामा मुख्य गाउँ बाटो र सार्वजनिक चौक सफा गरियो।",
    date: "2083/02/12",
    status: "Completed",
    location: "Khaptad Chhanna-3",
  },
  {
    title: "आवश्यक सामुदायिक औजार सहयोग",
    description: "समुदायका लागि आवश्यक tools/equipment उपलब्ध गराइएको।",
    date: "2083/03/04",
    status: "Completed",
    location: "Bajhang",
  },
  {
    title: "सामाजिक जनचेतना अभियान",
    description: "स्वच्छता, समानता र युवा सहभागिताबारे सचेतना कार्यक्रम।",
    date: "2083/04/21",
    status: "In Progress",
    location: "Khaptad Chhanna",
  },
];
const programs = [
  {
    name: "स्वच्छ गाउँ, स्वस्थ समाज",
    date: "2083/05/18",
    type: "Environmental",
    detail: "सफा गाउँ अभियान र सामुदायिक सहभागिता कार्यक्रम।",
  },
  {
    name: "युवा खेलकुद मिलन",
    date: "2083/06/08",
    type: "Sports",
    detail: "स्थानीय युवाहरूबीच मैत्रीपूर्ण खेलकुद कार्यक्रम।",
  },
  {
    name: "समता संवाद",
    date: "2083/06/25",
    type: "Awareness",
    detail: "सामाजिक समानता र नेतृत्व विकास संवाद।",
  },
];
const seedDonations: Donation[] = [
  {
    id: 1,
    donor: "Ram Sharki",
    amount: 5000,
    purpose: "Poor Family Support",
    date: "2083/01/10",
    method: "Cash",
    public: true,
    status: "Verified",
  },
  {
    id: 2,
    donor: "ABC Organization",
    amount: 10000,
    purpose: "Road Cleaning",
    date: "2083/02/15",
    method: "Bank Transfer",
    public: true,
    status: "Received",
  },
  {
    id: 3,
    donor: "Hari Bahadur",
    amount: 2500,
    purpose: "Youth Development",
    date: "2083/03/05",
    method: "eSewa",
    public: false,
    status: "Verified",
  },
  {
    id: 4,
    donor: "Dhan Maya Sarki",
    amount: 7500,
    purpose: "Sports Program",
    date: "2083/04/12",
    method: "Cash",
    public: true,
    status: "Verified",
  },
];

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
      <span className="h-px w-5 bg-primary" />
      {children}
    </span>
  );
}
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
        <Leaf className="size-5" />
      </div>
      <div>
        <p className="font-serif text-lg font-bold leading-none tracking-tight">
          जनकल्याण समता
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Yuwa Club · Bajhang
        </p>
      </div>
    </div>
  );
}
function Button({
  children,
  secondary = false,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  secondary?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${secondary ? "border border-border bg-card text-foreground hover:bg-muted" : "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary/90"}`}
    >
      {children}
    </button>
  );
}

export default function ClubPortal({
  initialAdmin = false,
}: {
  initialAdmin?: boolean;
}) {
  const [admin, setAdmin] = useState(initialAdmin);
  const { data: sessionData } = authClient.useSession();
  const [mobile, setMobile] = useState(false);
  const [donations, setDonations] = useState<Donation[]>(seedDonations);
  const [query, setQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [activeAdmin, setActiveAdmin] = useState("Overview");
  const [toast, setToast] = useState("");
  const [joinDone, setJoinDone] = useState(false);
  const [popup, setPopup] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [paymentQr, setPaymentQr] = useState<{
    bankQrUrl?: string | null;
    esewaQrUrl?: string | null;
    banks?: { id: string; name: string; accountHolder?: string | null; accountNumber?: string | null; qrUrl?: string | null }[];
  }>({});
  const [liveData, setLiveData] = useState<{
    members?: { name: string; role?: string }[];
    works?: Work[];
    programs?: {
      name: string;
      detail?: string;
      date?: string;
      type?: string;
    }[];
    gallery?: { title: string; imageUrl: string; category?: string }[];
    announcements?: { title: string; body: string; category?: string }[];
    committee?: {
      id: string;
      memberName: string;
      position: string;
      responsibilities?: string | null;
      workDetails?: string | null;
      workCount?: number;
      achievements?: string | null;
    }[];
    notices?: { id: string; title: string; body: string; category?: string; createdAt?: string }[];
    records?: {
      id: string;
      type: string;
      title: string;
      amount: number;
      category?: string | null;
      recordDate?: string | null;
    }[];
    donations?: Donation[];
  } | null>(null);
  useEffect(() => {
    const loadPaymentQr = () =>
      fetch(`/api/payment-settings?ts=${Date.now()}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!data) return;
          setPaymentQr(data);
          if (data.banks?.length) {
            setSelectedBankId((current) => current || data.banks[0].id);
          }
        });
    loadPaymentQr();
    const timer = window.setInterval(loadPaymentQr, 5000);
    Promise.all([
      fetch("/api/public/content", { cache: "no-store" }),
      fetch("/api/public/donations", { cache: "no-store" }),
    ])
      .then(async ([contentResponse, donationsResponse]) => {
        const contentData = contentResponse.ok
          ? await contentResponse.json()
          : null;
        const donationData = donationsResponse.ok
          ? await donationsResponse.json()
          : [];
        const raw = contentData ?? {};
        const fmtDate = (value: unknown) =>
          value ? new Date(String(value)).toLocaleDateString("en-GB") : "";
        const workStatus = (value: unknown) =>
          value === "completed"
            ? "Completed"
            : value === "in_progress" || value === "ongoing"
              ? "In Progress"
              : value === "pending"
                ? "Pending"
                : String(value ?? "Pending");
        setLiveData({
          ...raw,
          works: (raw.works ?? []).map((w: Record<string, unknown>) => ({
            title: String(w.title ?? ""),
            description: String(w.description ?? ""),
            date: fmtDate(w.workDate),
            status: workStatus(w.status),
            location: String(w.location ?? "Khaptad Chhanna-3"),
          })),
          programs: (raw.programs ?? []).map((p: Record<string, unknown>) => ({
            name: String(p.name ?? ""),
            date: fmtDate(p.programDate),
            type: String(p.status ?? "Upcoming"),
            detail: String(p.description ?? ""),
          })),
          members: (raw.members ?? []).map((m: Record<string, unknown>) => ({
            name: String(m.name ?? ""),
            role: String(m.role ?? "Member"),
          })),
          committee: raw.committee ?? [],
          notices: raw.notices ?? [],
          records: (raw.records ?? []).map((r: Record<string, unknown>) => ({
            id: String(r.id ?? ""),
            type: String(r.type ?? "income"),
            title: String(r.title ?? ""),
            amount: Number(r.amount ?? 0),
            category: r.category ? String(r.category) : null,
            recordDate: r.recordDate ? String(r.recordDate) : null,
          })),
          announcements: (raw.announcements ?? []).map(
            (a: Record<string, unknown>) => ({
              title: String(a.title ?? ""),
              body: String(a.body ?? ""),
              category: String(a.category ?? "Update"),
            }),
          ),
          donations: donationData.map((d: Record<string, unknown>) => ({
            ...d,
            public: Boolean(d.isPublic),
            status:
              d.status === "verified"
                ? "Verified"
                : d.status === "received"
                  ? "Received"
                  : "Pending",
            date: d.receivedAt
              ? new Date(String(d.receivedAt)).toLocaleDateString("en-GB")
              : "",
          })),
        });
      })
      .catch(() => null);
    return () => window.clearInterval(timer);
  }, []);

  const liveDonationRows = liveData?.donations ?? donations;
  const verifiedTotal = liveDonationRows
    .filter((d) => d.status !== "Pending" && (liveData ? d.public : true))
    .reduce((sum, d) => sum + d.amount, 0);
  const publicDonations = liveDonationRows.filter((d) => d.public);
  const liveMembers = liveData?.members?.map((member) => member.name) ?? [];
  const filteredMembers = [
    ...(liveMembers.length
      ? liveMembers
      : [...committee.map((m) => m[0]), ...generalMembers]),
  ].filter((name) => name.toLowerCase().includes(memberQuery.toLowerCase()));
  const filteredDonations = donations.filter((d) =>
    `${d.donor} ${d.purpose} ${d.method}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const purposeTotals = purposes
    .slice(0, 6)
    .map((purpose) => ({
      purpose,
      amount: donations
        .filter((d) => d.purpose === purpose && d.status !== "Pending")
        .reduce((sum, d) => sum + d.amount, 0),
    }))
    .filter((item) => item.amount > 0);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function showPopup(title: string, body: string) {
    setPopup({ title, body });
  }
  async function addDonation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const photo = form.get("donorPhoto");
    let donorPhotoUrl = "";
    let donorPhotoPathname = "";
    if (photo instanceof File && photo.size > 0) {
      const upload = new FormData();
      upload.append("photo", photo);
      const uploaded = await fetch("/api/public/donations/photo", {
        method: "POST",
        body: upload,
      });
      if (!uploaded.ok) {
        flash("Photo upload failed. Please use JPG, PNG, or WebP under 5MB.");
        return;
      }
      const result = await uploaded.json();
      donorPhotoUrl = result.url;
      donorPhotoPathname = result.pathname;
    }
    const response = await fetch("/api/public/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donor: form.get("donor"),
        donorPhone: form.get("donorPhone"),
        donorEmail: form.get("donorEmail"),
        amount: Number(form.get("amount")),
        purpose: form.get("purpose"),
        method: form.get("method"),
        reference: form.get("reference"),
        donorPhotoUrl,
        donorPhotoPathname,
      }),
    });
    if (!response.ok) {
      flash("Donation could not be saved. Please try again.");
      return;
    }
    const item: Donation = {
      id: Date.now(),
      donor: String(form.get("donor")),
      amount: Number(form.get("amount")),
      purpose: String(form.get("purpose")),
      date: "2083/05/10",
      method: String(form.get("method")),
      public: false,
      status: "Pending",
      donorPhotoUrl,
    };
    setDonations((current) => [item, ...current]);
    setShowDonationForm(false);
    flash("Donation submitted for admin approval.");
  }

  if (admin) return <AdminDashboard onBack={() => setAdmin(false)} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {toast && (
        <div
          className="fixed right-5 top-5 z-50 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl"
          role="status"
        >
          {toast}
        </div>
      )}
      <ActionModal
        open={Boolean(popup)}
        title={popup?.title ?? ""}
        onClose={() => setPopup(null)}
      >
        {popup?.body}
      </ActionModal>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#home">
            <Logo />
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
            <a href="#about" className="hover:text-primary">
              About
            </a>
            <a href="#works" className="hover:text-primary">
              Our Works
            </a>
            <a href="#programs" className="hover:text-primary">
              Programs
            </a>
            <a href="#members" className="hover:text-primary">
              Members
            </a>
            <a
              href="#donate"
              className="font-bold text-primary hover:underline"
            >
              Donate
            </a>
            <a href="#donors" className="hover:text-primary">
              Our Donors
            </a>
            <a href="#contact" className="hover:text-primary">
              Contact
            </a>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {/* Admin login / Join community / Create member account are now in the "New" section */}
          </div>
          <button
            aria-label="Open menu"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
        {mobile && (
          <div className="border-t border-border bg-card px-5 py-4 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold">
              <a href="#about" onClick={() => setMobile(false)}>
                About
              </a>
              <a href="#works" onClick={() => setMobile(false)}>
                Our Works
              </a>
              <a href="#programs" onClick={() => setMobile(false)}>
                Programs
              </a>
              <a href="#members" onClick={() => setMobile(false)}>
                Members
              </a>
              <a href="#donors" onClick={() => setMobile(false)}>
                Our Donors
              </a>
            </div>
          </div>
        )}
      </header>
      <section
        id="member-panel"
        className="border-b border-primary/15 bg-primary/5"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Member panel
            </p>
            <h2 className="mt-1 text-xl font-bold">सदस्यको आफ्नै dashboard</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              secondary
              onClick={() => {
                window.location.href = "/member-login";
              }}
            >
              <LayoutDashboard className="size-4" />
              Member login
            </Button>
          </div>
        </div>
      </section>
      <main>
        <section
          id="home"
          className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/40 to-background"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
            <div>
              <Mark>Community in motion</Mark>
              <h1 className="mt-6 max-w-3xl font-serif text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                युवा एकता,
                <br />
                <span className="text-primary">समाज सेवा</span>
                <br />र समृद्धिको अभियान
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                जनकल्याण समता युवा क्लब is a youth-led movement from Bajhang
                building cleaner streets, stronger communities and a more equal
                future.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  secondary
                  onClick={() =>
                    showPopup(
                      "Our community work",
                      "Explore the impact log below to see completed initiatives, active programs, locations, and the people making them happen.",
                    )
                  }
                >
                  View our works
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-5 text-sm">
                <div>
                  <p className="font-serif text-2xl font-bold">2079</p>
                  <p className="text-muted-foreground">Established</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold">100</p>
                  <p className="text-muted-foreground">Members</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold">12+</p>
                  <p className="text-muted-foreground">Community actions</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-2xl shadow-primary/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
                      A shared responsibility
                    </p>
                    <p className="mt-4 max-w-sm font-serif text-3xl font-bold leading-tight">
                      हाम्रो गाउँ, हाम्रो जिम्मेवारी।
                    </p>
                  </div>
                  <Sparkles className="size-7 text-accent" />
                </div>
                <div className="mt-16 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-primary-foreground/10 p-4">
                    <p className="text-2xl font-bold">05</p>
                    <p className="text-xs text-primary-foreground/70">
                      Works completed
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary-foreground/10 p-4">
                    <p className="text-2xl font-bold">03</p>
                    <p className="text-xs text-primary-foreground/70">
                      Active programs
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-primary-foreground/15 pt-4 text-sm">
                  <div className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground">
                    <HandHeart className="size-4" />
                  </div>
                  <span>Serving Khaptad Chhanna-3, Bajhang</span>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border bg-card p-4 shadow-xl sm:block">
                <p className="text-2xl font-bold text-primary">01</p>
                <p className="text-xs text-muted-foreground">
                  village, many hands
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* NEW section — Admin Login / Join Our Community / Create Member Account */}
        <section id="new" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="size-3.5" /> New
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold">
              Login & join portals
            </h2>
            <p className="mt-3 text-muted-foreground">
              तीनवटा अलग system — आफ्नो प्रयोग अनुसार छान्नुहोस्।
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <a
              href="/sign-in"
              className="group rounded-3xl border border-primary/20 bg-primary/5 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Admin Login</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                क्लब व्यवस्थापन: members, records, donations, programs —
                admin/staff को लागि मात्र।
              </p>
              <span className="mt-4 inline-block text-sm font-bold text-primary group-hover:underline">
                Click → Admin Login
              </span>
            </a>
            <a
              href="/member-login"
              className="group rounded-3xl border border-orange-300 bg-orange-50/60 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-orange-600 text-white">
                <UserRound className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Create Member Account</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Admin-approved official members — admin ले email Active
                गरेपछि मात्र signup।
              </p>
              <span className="mt-4 inline-block text-sm font-bold text-orange-700 group-hover:underline">
                Click → Member Login / Signup
              </span>
            </a>
            <a
              href="/community-login"
              className="group rounded-3xl border border-blue-300 bg-blue-50/60 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white">
                <Users className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Join Our Community</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Public community users — updates, announcements, events र
                community content।
              </p>
              <span className="mt-4 inline-block text-sm font-bold text-blue-700 group-hover:underline">
                Click → Community Login / Signup
              </span>
            </a>
          </div>
        </section>
        <section id="about" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <Mark>Who we are</Mark>
              <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                युवा नेतृत्वले
                <br />
                बनाउँदैछ <span className="text-primary">भोलि।</span>
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                ���नकल्याण समता युवा क्लबको मुख्य उद्देश्य दलित, महिला तथा पछाडि
                पारिएका समुदाय, गरिब, दुःखी र असहाय नागरिकका लागि न्याय, सहयोग र
                समान अवसरको वातावरण निर्मा��� गर्नु हो। दलित समुदायले लामो
                समयदेखि भोग्दै आएको विभेद, हेपाइ र सामाजिक अन्या���को अन्त्य
                गर्दै दलित ��ुक्ति, सम्मान, स्वतन्त्रता र सबैले समान रूपमा
                बाँच्न पाउने समाज निर्माण हाम्रो मूल मान्यता हो।
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <Leaf className="size-5 text-primary" />
                  <h3 className="mt-4 font-bold">समानता र सामाजिक न्याय</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    जातीय विभेद, छुवाछूत, हेपाइ र सबै प्रकारका अन्यायविरुद्ध
                    सचेतना र सामूहिक अभियान।
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <Users className="size-5 text-primary" />
                  <h3 className="mt-4 font-bold">दलित मुक्ति र सम्मान</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    दलित समुदायको अधिकार, आत्मसम्मान, स्वतन्त्रता र नेतृत्व
                    विकासका लागि सहकार्य।
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <HandHeart className="size-5 text-primary" />
                  <h3 className="mt-4 font-bold">सहयोग र संरक्षण</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    गरिब, दुःखी, असहाय तथा विपन्न परिवारलाई आवश्यक सहयोग र
                    अवसरमा पहुँच।
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <CalendarDays className="size-5 text-primary" />
                  <h3 className="mt-4 font-bold">समावेशी भविष्य</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    खप्तड छेडेदह–३ बाट सुरु भएको अभियान, जहाँ सबैले सम्मान र
                    समान अधिकारसहित बाँच्न पाऊन्।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="works" className="bg-secondary/60">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Mark>Impact log</Mark>
                <h2 className="mt-4 font-serif text-4xl font-bold">
                  हामीले गरेका कामहरू
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Small, consistent acts that make community life safer, kinder
                and more connected.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {(liveData?.works?.length ? liveData.works : works).map(
                (work, index) => (
                  <article
                    key={work.title}
                    className={`rounded-2xl border border-border bg-card p-6 ${index === 0 ? "md:-translate-y-4 md:bg-primary md:text-primary-foreground" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold opacity-60">
                        0{index + 1}
                      </span>
                      <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground">
                        {work.status}
                      </span>
                    </div>
                    <h3 className="mt-12 font-serif text-2xl font-bold">
                      {work.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 opacity-70">
                      {work.description}
                    </p>
                    <div className="mt-8 flex items-center justify-between border-t border-current/10 pt-4 text-xs opacity-70">
                      <span>{work.date}</span>
                      <span>{work.location}</span>
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
        <section id="programs" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <Mark>Next together</Mark>
              <h2 className="mt-4 font-serif text-4xl font-bold">
                Upcoming
                <br />
                <span className="text-primary">programs</span>
              </h2>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Join our next community actions or partner with us to make them
                possible.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {(liveData?.programs?.length ? liveData.programs : programs).map(
                (program) => (
                  <article
                    key={program.name}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-lg sm:p-5"
                  >
                    <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-accent text-center text-accent-foreground">
                      <span className="text-[10px] font-bold uppercase">
                        2083
                      </span>
                      <span className="text-lg font-bold">
                        {program.date.split("/")[1]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{program.name}</h3>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {program.type}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {program.detail}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
        {!!(
          liveData?.announcements?.length ||
          liveData?.notices?.length ||
          liveData?.gallery?.length
        ) && (
          <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-2 lg:px-8">
            {liveData?.announcements?.length || liveData?.notices?.length ? (
              <div>
                <Mark>Latest updates</Mark>
                <h2 className="mt-4 font-serif text-4xl font-bold">
                  Announcements
                </h2>
                <div className="mt-6 grid gap-3">
                  {(liveData?.announcements ?? []).slice(0, 4).map((item) => (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {item.category}
                      </p>
                      <h3 className="mt-2 font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.body}
                      </p>
                    </article>
                  ))}
                  {(liveData?.notices ?? []).map((item) => (
                    <article
                      key={item.id ?? item.title}
                      className="rounded-2xl border border-accent/30 bg-accent/5 p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
                        {item.category ?? "Notice"}
                      </p>
                      <h3 className="mt-2 font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
            {liveData?.gallery?.length ? (
              <div>
                <Mark>From the field</Mark>
                <h2 className="mt-4 font-serif text-4xl font-bold">Gallery</h2>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {liveData.gallery.slice(0, 4).map((item) => (
                    <figure
                      key={item.title}
                      className="overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="aspect-square w-full object-cover"
                      />
                      <figcaption className="p-3 text-sm font-semibold">
                        {item.title}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}
        <section id="donate" className="border-y border-border bg-secondary/60">
          <div className="mx-auto max-w-7xl px-5 py-16 text-center lg:px-8">
            <Mark>Support the mission</Mark>
            <h2 className="mt-4 font-serif text-4xl font-bold">Donate</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Support our community work.
            </p>
            <button
              type="button"
              onClick={() => setShowDonationForm((open) => !open)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm"
            >
              {showDonationForm ? "Close donation form" : "Donate here"}{" "}
              <ChevronRight className="size-4" />
            </button>
            {showDonationForm && (
              <div className="mx-auto mt-8 max-w-2xl text-left">
                <form
                  onSubmit={addDonation}
                  className="grid gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      name="donor"
                      required
                      placeholder="Donor name"
                      className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                    <input
                      name="amount"
                      required
                      type="number"
                      min="1"
                      placeholder="Amount (Rs.)"
                      className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      name="donorPhone"
                      type="tel"
                      placeholder="Phone number"
                      className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                    <input
                      name="donorEmail"
                      type="email"
                      placeholder="Email address"
                      className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      name="purpose"
                      required
                      defaultValue=""
                      className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="" disabled>
                        Select purpose
                      </option>
                      {purposes.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                    <select
                      name="method"
                      required
                      defaultValue=""
                      onChange={(event) =>
                        setSelectedPaymentMethod(event.target.value)
                      }
                      className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="" disabled>
                        Payment method
                      </option>
                      <option>Cash</option>
                      <option>Bank transfer</option>
                      <option>eSewa</option>
                      <option>Other</option>
                    </select>
                    {selectedPaymentMethod === "Bank transfer" && (
                      <div className="sm:col-span-2">
                        {paymentQr.banks && paymentQr.banks.length > 0 ? (
                          <>
                            <select
                              value={selectedBankId}
                              onChange={(event) => setSelectedBankId(event.target.value)}
                              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                              aria-label="Select bank"
                            >
                              {paymentQr.banks.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                  {bank.name}
                                  {bank.accountHolder ? ` — ${bank.accountHolder}` : ""}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const bank = paymentQr.banks.find((b) => b.id === selectedBankId);
                              const url = bank?.qrUrl || paymentQr.bankQrUrl;
                              return url ? (
                                <img
                                  src={url}
                                  alt={`${bank?.name ?? "Bank"} payment QR`}
                                  className="mt-3 max-h-52 w-full rounded-xl border bg-background object-contain p-3"
                                />
                              ) : (
                                <p className="mt-3 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                                  {bank?.name} QR is not configured yet.
                                </p>
                              );
                            })()}
                          </>
                        ) : paymentQr.bankQrUrl ? (
                          <img
                            src={paymentQr.bankQrUrl}
                            alt="Bank payment QR"
                            className="max-h-52 w-full rounded-xl border bg-background object-contain p-3"
                          />
                        ) : (
                          <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                            Bank QR is not configured yet.
                          </p>
                        )}
                      </div>
                    )}
                    {selectedPaymentMethod === "eSewa" &&
                      (paymentQr.esewaQrUrl ? (
                        <img
                          src={paymentQr.esewaQrUrl}
                          alt="eSewa payment QR"
                          className="max-h-52 w-full rounded-xl border bg-background object-contain p-3"
                        />
                      ) : (
                        <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          eSewa QR is not configured yet.
                        </p>
                      ))}
                  </div>
                  <input
                    name="reference"
                    placeholder="Transaction/reference number (optional)"
                    className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                  />
                  <label className="text-sm font-semibold">
                    Donor photo (optional)
                    <input
                      name="donorPhoto"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="mt-2 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <Button type="submit">
                    Submit donation <ChevronRight className="size-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </section>
        <section id="donors" className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <Mark>Open books, shared trust</Mark>
                <h2 className="mt-5 font-serif text-4xl font-bold sm:text-5xl">
                  हाम्रो सहयोग data
                </h2>
                <p className="mt-2 text-sm font-semibold text-primary-foreground/80">
                  Public भएका ��हयोगी दाताहरूको विवरण
                </p>
                <p className="mt-5 max-w-md leading-7 text-primary-foreground/70">
                  Thank you to the people and organizations investing in a
                  stronger community. Donor visibility is always shared with
                  consent.
                </p>
                <div className="mt-8 flex gap-8">
                  <div>
                    <p className="font-serif text-3xl font-bold">
                      {publicDonations.length}
                    </p>
                    <p className="text-xs text-primary-foreground/60">
                      Public donors
                    </p>
                  </div>
                  <div>
                    <p className="font-serif text-3xl font-bold">
                      {money(publicDonations.reduce((s, d) => s + d.amount, 0))}
                    </p>
                    <p className="text-xs text-primary-foreground/60">
                      Public support
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {publicDonations.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-5"
                  >
                    <div className="flex items-center gap-3">
                      {d.donorPhotoUrl ? (
                        <img
                          src={d.donorPhotoUrl}
                          alt={`${d.donor} donor`}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid size-10 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                          {initials(d.donor)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold">{d.donor}</p>
                        <p className="text-xs text-primary-foreground/60">
                          {d.date}
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 font-serif text-2xl font-bold">
                      {money(d.amount)}
                    </p>
                    <p className="mt-1 text-xs text-primary-foreground/60">
                      {d.purpose} · {d.method}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {!!liveData?.records?.length && (
          <section id="records" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <Mark>Transparency</Mark>
            <h2 className="mt-4 font-serif text-4xl font-bold">आर्थिक अभिलेख — Club Records</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              कति चन्दा/आम्दानी उठ्यो र कति खर्च भयो — सार्वजनिक अभिलेख।
            </p>
            {(() => {
              const income = liveData.records!.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount || 0), 0);
              const expense = liveData.records!.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount || 0), 0);
              return (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
                    <p className="text-sm text-muted-foreground">कुल आम्दानी</p>
                    <p className="mt-2 text-3xl font-bold text-primary">Rs. {income.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                    <p className="text-sm text-muted-foreground">कुल खर्च</p>
                    <p className="mt-2 text-3xl font-bold">Rs. {expense.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground">बाँकी रकम</p>
                    <p className="mt-2 text-3xl font-bold">Rs. {(income - expense).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              );
            })()}
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {liveData.records.map((record) => (
                <article key={record.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                  <div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${record.type === "income" ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {record.type === "income" ? "Chanda / Income" : "Expense"}
                    </span>
                    <h3 className="mt-2 font-bold">{record.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.category ? `${record.category} · ` : ""}
                      {record.recordDate ? new Date(record.recordDate).toLocaleDateString("en-GB") : ""}
                    </p>
                  </div>
                  <p className={`shrink-0 text-lg font-bold ${record.type === "income" ? "text-primary" : "text-destructive"}`}>
                    {record.type === "income" ? "+" : "−"} Rs. {Number(record.amount).toLocaleString("en-IN")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
        <section id="members" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <Mark>People power</Mark>
              <h2 className="mt-4 font-serif text-4xl font-bold">
                Our members
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                100 young people, one shared purpose.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                aria-label="Search members"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Search members"
                className="w-56 rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          {(!memberQuery ||
            memberQuery.toLowerCase().includes("committee") ||
            memberQuery.toLowerCase().includes("समिति")) && (
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  कार्यसमिति
                </h3>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(liveData?.committee?.length
                  ? [...liveData.committee].sort((a, b) =>
                      a.position === "अध्यक्ष" ? -1 : b.position === "अध्यक्ष" ? 1 : 0,
                    )
                  : committee.map(([memberName, position]) => ({
                      id: memberName,
                      memberName,
                      position,
                    }))
                ).map((member, index) => (
                  <div
                    key={member.id ?? member.memberName}
                    className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${index === 0 ? "border-primary bg-primary text-primary-foreground sm:col-span-2 lg:col-span-2" : "border-primary/20 bg-primary/5"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold ${index === 0 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}
                      >
                        {initials(member.memberName)}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                          {member.position}
                        </p>
                        <p className="mt-1 text-lg font-bold">{member.memberName}</p>
                        {member.achievements && (
                          <p className="mt-1 line-clamp-1 text-[11px] opacity-70">
                            {member.achievements}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(liveData?.members?.length
              ? liveData.members.map((member) => ({
                  name: member.name,
                  role: member.role || "General member",
                }))
              : generalMembers.map((name) => ({ name, role: "General member" }))
            )
              .filter((member) =>
                member.name.toLowerCase().includes(memberQuery.toLowerCase()),
              )
              .slice(0, 12)
              .map((member) => (
                <div
                  key={member.name}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-bold text-muted-foreground">
                      {initials(member.name)}
                    </div>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-primary">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
        <section id="join" className="border-y border-border bg-secondary/60">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[1fr_.8fr] lg:items-center lg:px-8">
            <div>
              <Mark>Be part of it</Mark>
              <h2 className="mt-4 font-serif text-4xl font-bold">
                Join our community.
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
                जो कोही पनि join गर्न सक्नुहुन्छ — कुनै पूर्व-approval चाहिँदैन।
                Form भरेपछि member account बनाउन सकिन्छ; admin ले Active गरेपछि
                मात्र dashboard खुल्छ।
              </p>
            </div>
            <form
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const response = await fetch("/api/public/applications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: data.get("name"),
                    phone: data.get("phone"),
                    email: data.get("email"),
                    message: data.get("message"),
                  }),
                });
                if (response.ok) {
                  const result = await response.json().catch(() => null);
                  form.reset();
                  if (result?.memberCreated) {
                    flash(
                      "Application submitted! अब तलको 'Create member account' बाट तुरुन्तै आफ्नो account बनाउन सक्नुहुन्छ — admin approval पछि Active हुन्छ।",
                    );
                    setJoinDone(true);
                  } else {
                    flash("Application submitted. We will be in touch.");
                  }
                } else flash("Please check your details and try again.");
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  placeholder="Full name"
                  className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                />
                <input
                  name="phone"
                  required
                  type="tel"
                  placeholder="Phone number"
                  className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <input
                name="email"
                required
                type="email"
                placeholder="Email address"
                className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              />
              <textarea
                name="message"
                placeholder="Why would you like to join?"
                className="mt-3 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              />
              <Button type="submit">
                Submit application <ChevronRight className="size-4" />
              </Button>
            </form>
            {joinDone && (
              <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-center">
                <p className="text-sm font-bold text-accent-foreground">
                  तपाईंको application submit भयो!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  अब आफ्नो member account बनाउनुहोस् — admin ले Active गरेपछि member
                  dashboard प्रयोग गर्न पाउनुहुन्छ।
                </p>
                <a
                  href="/member-signup"
                  className="mt-3 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  Create member account now
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer id="contact" className="bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Leaf className="size-5" />
              </div>
              <div>
                <p className="font-serif text-lg font-bold">जनकल्याण समता</p>
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-50">
                  Yuwa Club
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-6 opacity-60">
              Youth unity, social service and prosperity for Khaptad Chhanna-3,
              Bajhang.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Find us
            </p>
            <p className="mt-4 text-sm leading-6 opacity-70">
              Khaptad Chhanna-3
              <br />
              Bajhang, Sudurpashchim
              <br />
              Nepal
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Connect
            </p>
            <p className="mt-4 text-sm leading-6 opacity-70">
              basyalsamir099@gmail.com
              <br />
              9766416671
            </p>
            <div className="mt-4 flex gap-2">
              <a
                aria-label="Facebook"
                href="#"
                className="grid size-9 place-items-center rounded-lg bg-background/10"
              >
                <Globe2 className="size-4" />
              </a>
              <a
                aria-label="Message"
                href="#"
                className="grid size-9 place-items-center rounded-lg bg-background/10"
              >
                <MessageCircle className="size-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 py-5 text-center text-xs opacity-40">
          © 2083 Janakalyan Samata Yuwa Club. Built for community.
        </div>
      </footer>
    </div>
  );
}

function AdminView({
  active,
  setActive,
  donations,
  filteredDonations,
  query,
  setQuery,
  verifiedTotal,
  purposeTotals,
  setAdmin,
  onAdd,
  showForm,
  onSubmit,
  onClose,
  flash,
  toast,
}: {
  active: string;
  setActive: (s: string) => void;
  donations: Donation[];
  filteredDonations: Donation[];
  query: string;
  setQuery: (s: string) => void;
  verifiedTotal: number;
  purposeTotals: { purpose: string; amount: number }[];
  setAdmin: (b: boolean) => void;
  onAdd: () => void;
  showForm: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  flash: (s: string) => void;
  toast: string;
}) {
  const nav = [
    ["Overview", LayoutDashboard],
    ["Members", Users],
    ["Programs", CalendarDays],
    ["Works", ClipboardList],
    ["Donations", HandHeart],
    ["Expenses", WalletCards],
    ["Reports", BarChart3],
  ] as const;
  const expense = 32500;
  const balance = verifiedTotal - expense;
  return (
    <div className="min-h-screen bg-secondary/50 text-foreground">
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl">
          {toast}
        </div>
      )}
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-5 lg:block">
          <Logo />
          <div className="mt-12">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Workspace
            </p>
            <nav className="mt-3 flex flex-col gap-1">
              {nav.map(([label, Icon]) => (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-10 rounded-2xl bg-secondary p-4">
            <ShieldCheck className="size-5 text-primary" />
            <p className="mt-3 text-sm font-bold">Admin mode</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Private finance and donor records are protected.
            </p>
          </div>
          <button
            onClick={() => setAdmin(false)}
            className="mt-5 flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <ChevronRight className="size-4 rotate-180" />
            Back to website
          </button>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Admin dashboard
              </p>
              <h1 className="mt-1 font-serif text-2xl font-bold">{active}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:block">
                Treasurer · Samir Sharki
              </span>
              <div className="grid size-10 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                SS
              </div>
            </div>
          </header>
          <div className="p-5 lg:p-8">
            <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
              {nav.map(([label, Icon]) => (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${active === label ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                >
                  <Icon className="size-3" />
                  {label}
                </button>
              ))}
            </div>
            {active === "Overview" || active === "Donations" ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Namaste, Samir
                    </p>
                    <h2 className="mt-1 font-serif text-3xl font-bold">
                      Club at a glance
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      secondary
                      onClick={() => flash("CSV report prepared for download.")}
                    >
                      Export report
                    </Button>
                    <Button onClick={onAdd}>
                      <Plus className="size-4" />
                      Add donation
                    </Button>
                  </div>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    icon={Users}
                    label="Total members"
                    value="100"
                    note="+8 this year"
                  />
                  <Metric
                    icon={CalendarDays}
                    label="Active programs"
                    value="03"
                    note="2 upcoming"
                  />
                  <Metric
                    icon={CircleDollarSign}
                    label="Total income"
                    value={money(verifiedTotal)}
                    note="Received + verified"
                  />
                  <Metric
                    icon={WalletCards}
                    label="Current balance"
                    value={money(balance)}
                    note="After expenses"
                  />
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Income & expenses</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Monthly financial movement
                        </p>
                      </div>
                      <BarChart3 className="size-5 text-primary" />
                    </div>
                    <div className="mt-8 flex h-48 items-end gap-3 border-b border-border px-2">
                      {[42, 64, 38, 76, 55, 88, 68, 92, 61, 78, 52, 84].map(
                        (height, i) => (
                          <div key={i} className="flex flex-1 items-end gap-1">
                            <div
                              className="w-1/2 rounded-t bg-primary/80"
                              style={{ height: `${height}%` }}
                            />
                            <div
                              className="w-1/2 rounded-t bg-accent"
                              style={{
                                height: `${Math.max(18, height - 35)}%`,
                              }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                    <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <i className="size-2 rounded-full bg-primary" />
                        Income
                      </span>
                      <span className="flex items-center gap-2">
                        <i className="size-2 rounded-full bg-accent" />
                        Expenses
                      </span>
                    </div>
                  </section>
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Purpose balances</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Donation minus expenses
                        </p>
                      </div>
                      <CircleDollarSign className="size-5 text-primary" />
                    </div>
                    <div className="mt-6 flex flex-col gap-4">
                      {purposeTotals.map(({ purpose, amount }) => (
                        <div key={purpose}>
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{purpose}</span>
                            <span>{money(amount)}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-secondary">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${Math.min(100, amount / 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      {purposeTotals.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No purpose data yet.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
                <section className="mt-6 rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">Donation management</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {donations.length} records · public visibility is
                        consent-based
                      </p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search donations"
                        className="w-56 rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="border-b border-border text-xs text-muted-foreground">
                        <tr>
                          <th className="pb-3 font-semibold">Donor</th>
                          <th className="pb-3 font-semibold">Purpose</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Method</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold">Visibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredDonations.map((d) => (
                          <tr key={d.id}>
                            <td className="py-4 font-semibold">
                              {d.donor}
                              <span className="block text-xs font-normal text-muted-foreground">
                                {d.date}
                              </span>
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {d.purpose}
                            </td>
                            <td className="py-4 font-bold">
                              {money(d.amount)}
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {d.method}
                            </td>
                            <td className="py-4">
                              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                                {d.status}
                              </span>
                            </td>
                            <td className="py-4 text-xs">
                              {d.public ? "Public" : "Admin only"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <GenericAdmin active={active} onAdd={onAdd} flash={flash} />
            )}
          </div>
        </main>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-5">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  New record
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold">
                  Add donation
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input
                name="donor"
                required
                placeholder="Donor name"
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
              />
              <input
                name="amount"
                required
                type="number"
                min="1"
                placeholder="Amount (NPR)"
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
              />
              <select
                name="purpose"
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
              >
                {purposes.map((purpose) => (
                  <option key={purpose}>{purpose}</option>
                ))}
              </select>
              <select
                name="method"
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>eSewa</option>
                <option>Khalti</option>
                <option>Other</option>
              </select>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" name="public" className="accent-primary" />
              Show this donor publicly
            </label>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              This donation will be added to official income as Received. It can
              be verified or cancelled from the record later.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button secondary onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save donation</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <Icon className="size-5 text-primary" />
      </div>
      <p className="mt-5 font-serif text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
function GenericAdmin({
  active,
  onAdd,
  flash,
}: {
  active: string;
  onAdd: () => void;
  flash: (s: string) => void;
}) {
  const Icon =
    active === "Members"
      ? Users
      : active === "Programs"
        ? CalendarDays
        : active === "Works"
          ? ClipboardList
          : active === "Expenses"
            ? WalletCards
            : FileText;
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
          <h2 className="mt-5 font-serif text-3xl font-bold">
            {active} workspace
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Manage {active.toLowerCase()} with the same connected records used
            across the club website. Add, edit, filter and export from this
            workspace.
          </p>
        </div>
        <Button
          onClick={() => {
            onAdd();
            flash(`Add ${active.toLowerCase()} form opened.`);
          }}
        >
          <Plus className="size-4" />
          Add {active.slice(0, -1)}
        </Button>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-2xl font-bold">
            {active === "Members"
              ? "100"
              : active === "Programs"
                ? "03"
                : active === "Works"
                  ? "05"
                  : "12"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {active.toLowerCase()}
          </p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-2xl font-bold">
            {active === "Works" ? "01" : "08"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Active this period
          </p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-2xl font-bold">100%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Records synchronized
          </p>
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
        <CheckCircle2 className="mx-auto size-8 text-primary" />
        <p className="mt-3 font-bold">Ready for your next record</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the action above to create a connected record.
        </p>
      </div>
    </section>
  );
}

const icon = { Component: Leaf };

export { purposes };
