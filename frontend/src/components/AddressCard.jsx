import React from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaStar, FaPhone, FaMapMarkerAlt, FaGlobe, FaTruck } from 'react-icons/fa';
import { formatAddressShort } from '../utils/formatAddress';
import Button from './Button';

const labelColors = {
  Home: 'bg-blue-100 text-blue-700 border-blue-200',
  Work: 'bg-purple-100 text-purple-700 border-purple-200',
  Office: 'bg-orange-100 text-orange-700 border-orange-200',
  Other: 'bg-gray-100 text-gray-600 border-gray-200',
};

const AddressCard = ({ address, onEdit, onDelete, onMakeDefault, onSelect }) => {
  return (
    <div className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between group h-full w-full box-border ${
      address.isDefault
      ? 'border-orange-500 bg-white shadow-md ring-2 ring-orange-500/5'
      : 'border-gray-200 bg-gray-50/40 hover:border-orange-300 hover:bg-white hover:shadow-sm'
    }`}>

      {address.isDefault ? (
        <div className="absolute -top-3 left-4 text-white flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-gray-950 px-4 py-1.5 rounded-lg shadow-sm z-10 border border-white">
          <FaCheckCircle className="text-orange-500 text-[10px]" />
          <span className="italic">Primary</span>
        </div>
      ) : (
        <Button
          onClick={() => onMakeDefault(address._id)}
          variant="secondary" size="sm"
          className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FaStar className="text-orange-400" />
          <span className="inline sm:hidden lg:inline">Set Primary</span>
        </Button>
      )}

      <div className="space-y-4 mt-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-transform duration-300 group-hover:rotate-[6deg] shrink-0 ${
            address.isDefault ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-400'
          }`}>
            {address.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h4 className="text-base font-black text-gray-900 uppercase tracking-tight truncate max-w-[140px] xs:max-w-[190px] sm:max-w-[220px]">
              {address.fullName}
            </h4>
            <span className="text-[8px] font-bold text-orange-600/70 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <FaGlobe size={8} /> {address.country || 'Logistics Node'}
            </span>
          </div>
          {address.addressLabel && (
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${labelColors[address.addressLabel] || labelColors.Other}`}>
              {address.addressLabel}
            </span>
          )}
        </div>

        <div className="space-y-2.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100 backdrop-blur-xs group-hover:bg-white transition-colors">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
              <FaMapMarkerAlt className="text-orange-600" size={8} />
            </div>
            <p className="text-gray-500 text-xs font-bold leading-normal italic">
              {formatAddressShort(address)}
            </p>
          </div>

          <div className="flex items-center gap-2 pl-0.5">
            <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></div>
            <p className="text-gray-900 text-[10px] font-black uppercase tracking-wide truncate">
              {address.city} <span className="text-gray-300 font-normal mx-0.5">/</span> {address.district}
            </p>
          </div>

          {(address.building || address.apartment || address.zipCode) && (
            <div className="flex flex-wrap gap-1.5 pl-0.5">
              {address.building && <span className="text-[8px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Bldg {address.building}</span>}
              {address.apartment && <span className="text-[8px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Apt {address.apartment}</span>}
              {address.zipCode && <span className="text-[8px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">ZIP {address.zipCode}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-900 text-[10px] font-mono font-bold tracking-wider bg-white border border-gray-200 w-max px-3 py-1.5 rounded-lg group-hover:bg-gray-950 group-hover:text-white group-hover:border-gray-950 transition-all duration-200">
          <FaPhone className={address.isDefault ? "text-orange-500 group-hover:text-white" : "text-gray-400 group-hover:text-white"} size={9} />
          {address.phone}
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-gray-100 flex gap-2 w-full box-border">
        {onSelect && (
          <Button onClick={() => onSelect(address)} variant="primary" className="flex-[3]">
            <FaTruck size={11} />
            Deliver here
          </Button>
        )}
        <Button onClick={() => onEdit(address)} variant="ghost" size="sm" className="flex-[2]">
          <FaEdit size={11} className="text-orange-400" />
          Edit
        </Button>
        <button
          onClick={() => onDelete(address._id)}
          className="flex-1 py-2.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-xl transition-all duration-200 flex items-center justify-center active:scale-90"
          title="Delete Address"
        >
          <FaTrash size={11} />
        </button>
      </div>

      <div className="absolute bottom-2 right-4 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <FaMapMarkerAlt size={60} />
      </div>
    </div>
  );
};

export default AddressCard;
