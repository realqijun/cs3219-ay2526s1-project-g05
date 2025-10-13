import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer id="footer" className="border-t dark:border-t-slate-700 bg-background dark:bg-background">
      <section className="container px-4 md:px-8 xl:px-16 py-10 flex flex-col items-center gap-4">
        <a rel="noreferrer noopener" href="/" className="font-bold text-xl flex items-center">
          <img src={logo} alt="PeerPrep logo" height="40" width="150" />
        </a>

        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} PeerPrep. All rights reserved.
        </p>
      </section>
    </footer>
  );
};
