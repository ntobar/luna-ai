import { Footer, Navbar } from '../components';
import { About, Explore, Feedback, GetStarted, Hero, Insights, WhatsNew, World } from '../sections';
import ContactCard from '../sections/Contact';

const Home = () => (
  <div className="bg-primary-black overflow-hidden">
    <Navbar />
    <Hero />
    <div className="relative">
      <About />
      <div className="gradient-03 z-0" />
      <Explore />
    </div>
    <div className="relative">
      <GetStarted />
      <div className="gradient-04 z-0" />
      <WhatsNew />
    </div>
    <World />
    <div className="relative">
      <Insights />
      <div className="gradient-04 z-0" />
      <Feedback />
      <ContactCard />
    </div>
    <Footer />
  </div>
);

export default Home;
