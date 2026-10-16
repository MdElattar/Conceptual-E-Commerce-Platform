import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FaPlus, FaTimes, FaLocationArrow, FaShieldAlt, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import AddressCard from '../components/AddressCard';
import { setAddresses } from '../slices/authSlice';
import { useGetProfileQuery } from '../slices/usersApiSlice';
import {
  useGetSavedAddressesQuery,
  useAddNewAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '../slices/addressesApiSlice';

const AddressScreen = () => {
  const dispatch = useDispatch();
  const { data: profile } = useGetProfileQuery();
  const { data: savedAddresses = [], isLoading, refetch: refetchAddresses } = useGetSavedAddressesQuery();
  const [addNewAddress, { isLoading: isAdding }] = useAddNewAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const addresses = savedAddresses.length > 0 ? savedAddresses : (profile?.addresses || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const initialFormState = {
    fullName: '', phone: '', city: '', district: '', addressLine: '',
    country: 'EG', state: '', building: '', apartment: '', zipCode: '',
    addressLabel: 'Home', notes: '', isDefault: false,
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (addresses.length > 0) {
      dispatch(setAddresses(addresses));
    }
  }, [addresses, dispatch]);

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (address) => {
    setFormData({
      fullName: address.fullName || '',
      phone: address.phone || '',
      city: address.city || '',
      district: address.district || '',
      addressLine: address.addressLine || '',
      country: address.country || 'EG',
      state: address.state || '',
      building: address.building || '',
      apartment: address.apartment || '',
      zipCode: address.zipCode || '',
      addressLabel: address.addressLabel || 'Home',
      notes: address.notes || '',
      isDefault: address.isDefault || false,
    });
    setSelectedId(address._id);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.addressLine || !formData.city || !formData.district) {
      return toast.error("Please fill all required terminal fields");
    }

    try {
      if (editMode) {
        await updateAddress({ id: selectedId, ...formData }).unwrap();
        toast.success("Node configuration updated successfully");
      } else {
        await addNewAddress(formData).unwrap();
        toast.success("New logistics node registered");
      }
      setIsModalOpen(false);
      refetchAddresses();
    } catch (err) {
      toast.error(err?.data?.message || "Operation Failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this location variant from system?")) {
      try {
        await deleteAddress(id).unwrap();
        toast.info("Location Securely Purged");
        refetchAddresses();
      } catch (err) {
        toast.error(err?.data?.message || "Delete failed");
      }
    }
  };

  const handleMakeDefault = async (id) => {
    try {
      await setDefaultAddress(id).unwrap();
      toast.success("Primary logistics node updated");
      refetchAddresses();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  if (isLoading) return (
    <div className="min-h-[75vh] flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <FaSpinner className="text-orange-600 text-2xl animate-spin" />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Syncing Terminal Vault...</span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-gray-50 pt-24 sm:pt-28 pb-32 px-4 sm:px-6 antialiased box-border">
      <div className="max-w-7xl mx-auto w-full">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-16 gap-6 w-full pb-6 border-b border-gray-200/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-600">
              <FaShieldAlt size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.35em]">Logistics Vault</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
              My <span className="text-orange-600">Locations</span>
            </h1>
            <p className="text-gray-400 font-bold text-xs max-w-md leading-normal">Your saved destinations are cached and ready for instantaneous deployment.</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="w-full md:w-auto bg-gray-950 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-sm active:scale-95"
          >
            <FaPlus size={10} /> New Terminal Node
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full box-border">
          {addresses.map((addr) => (
            <div key={addr._id} className="w-full h-full box-border">
              <AddressCard
                address={addr}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
                onMakeDefault={handleMakeDefault}
              />
            </div>
          ))}

          {addresses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-4 border border-orange-100">
                <FaMapMarkerAlt className="text-orange-500" size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">Vault Registry Empty</h3>
              <p className="text-gray-400 text-xs font-bold mt-1">Add your first localized shipping node to unlock routing mechanics.</p>
            </div>
          )}

          <div
            onClick={handleOpenAddModal}
            className="group border-2 border-dashed border-gray-200 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center p-8 sm:p-12 cursor-pointer hover:bg-white transition-all duration-300 min-h-[220px] sm:min-h-[260px] bg-gray-50/50 box-border"
          >
            <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center mb-3 shadow-xs group-hover:bg-gray-950 transition-colors">
              <FaLocationArrow className="text-gray-400 group-hover:text-white transition-colors" size={14} />
            </div>
            <span className="text-gray-400 group-hover:text-gray-950 font-black text-[10px] tracking-widest uppercase transition-colors">Add Destination</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 relative my-auto max-h-[90vh] overflow-y-auto box-border">

            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
                  {editMode ? 'Modify' : 'Register'} <span className="text-orange-600">Node</span>
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Configuration Panel</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 transition-all">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 w-full box-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Receiver Identity</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Contact Terminal</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Country / Region</label>
                  <select className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}>
                    <option value="EG">Egypt</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">UAE</option>
                    <option value="KW">Kuwait</option>
                    <option value="QA">Qatar</option>
                    <option value="BH">Bahrain</option>
                    <option value="OM">Oman</option>
                    <option value="JO">Jordan</option>
                    <option value="LB">Lebanon</option>
                    <option value="PS">Palestine</option>
                    <option value="IQ">Iraq</option>
                    <option value="YE">Yemen</option>
                    <option value="LY">Libya</option>
                    <option value="SD">Sudan</option>
                    <option value="TN">Tunisia</option>
                    <option value="DZ">Algeria</option>
                    <option value="MA">Morocco</option>
                    <option value="TR">Turkey</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Address Label</label>
                  <select className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" value={formData.addressLabel} onChange={(e) => setFormData({ ...formData, addressLabel: e.target.value })}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">City Hub</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">State / Province</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Sector / District</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="District" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">ZIP / Postal Code</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="ZIP Code" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Building No.</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="Building" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Apartment / Suite</label>
                  <input className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all box-border" placeholder="Apartment" value={formData.apartment} onChange={(e) => setFormData({ ...formData, apartment: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Manifest Address Details</label>
                <textarea className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[90px] max-h-[140px] resize-none box-border" placeholder="Street parameters, Landmark info..." value={formData.addressLine} onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1">Delivery Notes (optional)</label>
                <textarea className="w-full bg-gray-50 border border-gray-200/80 p-3.5 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[60px] max-h-[100px] resize-none box-border" placeholder="Special instructions for delivery..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <label htmlFor="isDefault" className="text-[10px] font-black text-gray-600 uppercase tracking-wider">Set as default shipping location</label>
              </div>

              <button
                type="submit"
                disabled={isAdding || isUpdating}
                className="w-full bg-gray-950 hover:bg-orange-600 p-4 rounded-xl text-white font-bold uppercase text-xs tracking-wider transition-all duration-300 shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {(isAdding || isUpdating) ? (
                  <><FaSpinner className="animate-spin" /><span>Encrypting Parameters...</span></>
                ) : (
                  'Commit Location Payload'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressScreen;
