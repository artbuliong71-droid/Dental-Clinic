import { Link } from "react-router-dom";
import {
  CalendarPlus,
  ArrowRight,
  Stethoscope,
  Sparkles,
  Smile,
  UserRound,
  ShieldCheck,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ToothIcon, ToothPinIcon, BracesIcon } from "../components/ToothIcons";
import logo from "../assets/logo.jpg";
import lobby from "../assets/clinic-lobby.jpg";
import room from "../assets/clinic-room.jpg";
import "./home.css";

// Where the "Book Appointment" buttons go. Adjust the paths to match your App.jsx routes.
const bookingPath = (user) => {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (user.role === "staff") return "/staff";
  return "/dashboard";
};

const SERVICES = [
  {
    icon: Sparkles,
    title: "Prophylaxis",
    text: "Professional cleaning to remove plaque and tartar.",
  },
  {
    icon: ToothIcon,
    title: "Filling",
    text: "Repairs a tooth damaged by a cavity.",
  },
  {
    icon: ToothPinIcon,
    title: "Extraction",
    text: "Safe removal of a damaged or problem tooth.",
  },
  {
    icon: Stethoscope,
    title: "Check-up",
    text: "Routine exam of your teeth and gums.",
  },
  {
    icon: BracesIcon,
    title: "Orthodontics",
    text: "Braces fitting and adjustment to straighten your teeth.",
  },
];

const FEATURES = [
  {
    icon: UserRound,
    title: "Experienced team",
    text: "Skilled professionals you can trust.",
  },
  {
    icon: ShieldCheck,
    title: "Safe and clean environment",
    text: "Your safety is our priority.",
  },
  {
    icon: Heart,
    title: "Patient-centered care",
    text: "Your comfort matters.",
  },
];

const Home = () => {
  const { user } = useAuth();
  const book = bookingPath(user);

  return (
    <div className="gp-home">
      <header className="gp-header">
        <div className="gp-wrap gp-header-row">
          <a
            href="#home"
            className="gp-brand"
            aria-label="Germino-Punzal Dental Clinic"
          >
            <img src={logo} alt="" width="52" height="52" />
            <span>
              <strong>GERMINO-PUNZAL</strong>
              <small>DENTAL CLINIC</small>
            </span>
          </a>

          <nav className="gp-nav" aria-label="Main">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <Link to={book}>Appointments</Link>
            <a href="#contact">Contact</a>
          </nav>

          <div className="gp-header-actions">
            {!user && (
              <Link to="/login" className="gp-btn gp-btn-outline">
                Login
              </Link>
            )}
            <Link to={book} className="gp-btn gp-btn-solid">
              <CalendarPlus size={16} aria-hidden="true" />
              {user ? "Go to dashboard" : "Book appointment"}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="gp-hero">
          <div className="gp-wrap gp-hero-grid">
            <div className="gp-hero-copy">
              <p className="gp-pill">
                <Smile size={16} aria-hidden="true" /> Your smile, our priority
              </p>
              <h1>
                Let your smile <span>shine with us</span>
              </h1>
              <p className="gp-lead">
                At Germino-Punzal Dental Clinic, we provide quality,
                compassionate, and professional dental care for you and your
                family.
              </p>
              <div className="gp-cta-row">
                <Link to={book} className="gp-btn gp-btn-solid gp-btn-lg">
                  <CalendarPlus size={18} aria-hidden="true" /> Book appointment
                </Link>
                <a href="#about" className="gp-btn gp-btn-outline gp-btn-lg">
                  Learn more <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
            <img
              className="gp-hero-photo"
              src={lobby}
              alt="Reception area of Germino Dental Clinic with a wooden wall and gray sofa"
            />
          </div>
        </section>

        <section id="services" className="gp-section">
          <div className="gp-wrap">
            <h2 className="gp-title">
              Quality dental care for a healthier you
            </h2>
            <p className="gp-sub">
              We offer a wide range of dental services to keep your smile
              healthy, confident, and beautiful.
            </p>
            <div className="gp-services">
              {SERVICES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="gp-service">
                  <span className="gp-icon">
                    <Icon size={26} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="gp-section gp-about">
          <div className="gp-wrap gp-about-grid">
            <div>
              <h2 className="gp-title gp-left">
                Committed to your dental health
              </h2>
              <p>
                Germino-Punzal Dental Clinic is dedicated to providing
                high-quality dental services in a safe, comfortable, and
                friendly environment. Our experienced team uses modern
                technology to give every smile the best care.
              </p>
              <Link to={book} className="gp-btn gp-btn-solid">
                Book appointment
              </Link>
            </div>
            <img
              src={room}
              alt="Treatment room with a dental chair and wooden wall"
            />
            <ul className="gp-features">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="gp-icon gp-icon-round">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer id="contact" className="gp-footer">
        <div className="gp-wrap gp-footer-grid">
          <div className="gp-foot-brand">
            <img src={logo} alt="" width="56" height="56" />
            <div>
              <strong>GERMINO-PUNZAL</strong>
              <small>DENTAL CLINIC</small>
              <p>
                <MapPin size={14} aria-hidden="true" /> Maharlika Highway, Brgy.
                Burgos, Santa Rosa, Philippines 3100
              </p>
            </div>
          </div>

          <div>
            <p>
              <Phone size={16} aria-hidden="true" /> 0920 946 0710
            </p>
            <p>
              <Mail size={16} aria-hidden="true" /> jeangerminodmd@gmail.com
            </p>
          </div>

          <div>
            <h3>
              <Clock size={16} aria-hidden="true" /> Clinic hours
            </h3>
            <dl>
              <dt>Monday to Saturday</dt>
              <dd>9:00 AM to 3:00 PM</dd>
              <dt>Sunday</dt>
              <dd>Closed</dd>
            </dl>
          </div>

          <nav aria-label="Quick links">
            <h3>Quick links</h3>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <Link to={book}>Appointments</Link>
          </nav>
        </div>
        <p className="gp-copy">
          &copy; {new Date().getFullYear()} Germino-Punzal Dental Clinic. All
          rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
