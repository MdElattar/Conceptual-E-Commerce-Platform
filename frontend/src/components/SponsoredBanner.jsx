import React from 'react';
import { FaAd } from 'react-icons/fa';
import Button from './Button';

const defaultAds = [
  {
    title: "Upgrade Your Industrial Fleet",
    desc: "Get up to 25% off on certified heavy-duty powertrains and tactical storage units.",
    badge: "Sponsored Deals",
    btnText: "Explore Collection"
  },
  {
    title: "DK-TEC Premium Partnerships",
    desc: "Exclusive contractor-grade gear with extended structural warranties. Verified matching metrics.",
    badge: "Partner Feature",
    btnText: "View Solutions"
  }
];

const SponsoredBanner = ({ index = 0, ads = defaultAds }) => {
  const currentAd = ads[index % ads.length];

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 my-4 shadow-md border border-zinc-800 relative overflow-hidden group select-none">
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-600/10 rounded-full blur-2xl group-hover:bg-orange-600/20 transition-all duration-500"></div>
      <div className="flex flex-col gap-1.5 relative z-10">
        <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest w-fit flex items-center gap-1">
          <FaAd size={10} /> {currentAd.badge}
        </span>
        <h3 className="font-black text-lg md:text-xl tracking-tight text-white">{currentAd.title}</h3>
        <p className="text-xs text-zinc-400 max-w-2xl font-medium leading-relaxed">{currentAd.desc}</p>
      </div>
      <Button variant="primary" className="shrink-0">
        {currentAd.btnText}
      </Button>
    </div>
  );
};

export default SponsoredBanner;
