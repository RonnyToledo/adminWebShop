import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import styles from "./Sonner.module.css";
import MyProvider from "../../context/useContext";

export default function AdminLayout({ children }) {
  return (
    <MyProvider>
      <main className="sm:pl-14">{children}</main>
      <SonnerToaster className={styles.sonner_dark} />
      <UiToaster />
    </MyProvider>
  );
}
