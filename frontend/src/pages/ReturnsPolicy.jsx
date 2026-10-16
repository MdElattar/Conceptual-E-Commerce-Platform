import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaShieldAlt, FaUndo, FaCheckCircle, FaTimesCircle, FaClock, FaBox, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetReturnPolicyQuery, useGetMyReturnsQuery, useCreateReturnRequestMutation } from '../slices/returnsApiSlice';
import { useGetMyOrdersQuery } from '../slices/orderApiSlice';
import Button from '../components/Button';

const ReturnsPolicy = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: policy, isLoading: policyLoading } = useGetReturnPolicyQuery();
  const { data: myReturns, isLoading: returnsLoading } = useGetMyReturnsQuery(undefined, { skip: !userInfo });
  const { data: myOrders } = useGetMyOrdersQuery(undefined, { skip: !userInfo });
  const [createReturn] = useCreateReturnRequestMutation();

  const [showForm, setShowForm] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedOrderItem || !reason) {
      toast.error('Please select an item and provide a reason');
      return;
    }
    try {
      await createReturn({
        orderId: selectedOrderItem.orderId,
        orderItemId: selectedOrderItem._id,
        productId: selectedOrderItem.product,
        reason,
        details,
      }).unwrap();
      toast.success('Return request submitted successfully!');
      setShowForm(false);
      setReason('');
      setDetails('');
      setSelectedOrderItem(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit return request');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      received: 'bg-purple-100 text-purple-800 border-purple-200',
      refunded: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FaUndo className="text-orange-600" />
            Returns & Refunds
          </h1>
          <p className="text-gray-500 mt-1">Our commitment to your satisfaction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left - Policy Content */}
          <div className="lg:col-span-2 space-y-6">

            {policyLoading ? (
              <div className="bg-white rounded-2xl p-8 animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : policy ? (
              <>
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaClock className="text-orange-600" /> Return Period
                  </h2>
                  <p className="text-gray-700 font-medium">{policy.policy.returnPeriod}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" /> Eligibility
                  </h2>
                  <ul className="space-y-3">
                    {policy.policy.eligibility.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBox className="text-blue-600" /> Return Process
                  </h2>
                  <ol className="space-y-3 list-decimal list-inside">
                    {policy.policy.process.map((step, i) => (
                      <li key={i} className="text-gray-700">{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" /> Refund Method
                  </h2>
                  <p className="text-gray-700">{policy.policy.refundMethod}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTimesCircle className="text-red-600" /> Exceptions
                  </h2>
                  <ul className="space-y-3">
                    {policy.policy.exceptions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <FaTimesCircle className="text-red-400 mt-0.5 shrink-0" size={14} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            {/* My Return Requests */}
            {userInfo && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FaUndo className="text-orange-600" /> My Return Requests
                </h2>

                {returnsLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-12 bg-gray-100 rounded"></div>
                    <div className="h-12 bg-gray-100 rounded"></div>
                  </div>
                ) : myReturns?.length > 0 ? (
                  <div className="space-y-3">
                    {myReturns.map((ret) => (
                      <div key={ret._id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {ret.product?.name || 'Product'} - {ret.reason}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(ret.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(ret.status)}`}>
                          {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No return requests yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Right - Initiate Return */}
          <div className="sticky top-28 space-y-6">
            {userInfo ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                {!showForm ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <FaUndo className="text-orange-600" size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Need to return?</h3>
                        <p className="text-xs text-gray-500">Start a return request</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowForm(true)} variant="primary" size="full">
                      Initiate Return
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleSubmitReturn} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm">New Return Request</h3>
                      <Button
                        type="button"
                        onClick={() => setShowForm(false)}
                        variant="ghost"
                        size="xs"
                        className="text-xs text-gray-500 hover:text-red-500"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Select Order Item</label>
                      <select
                        value={selectedOrderItem ? `${selectedOrderItem.orderId}::${selectedOrderItem._id}` : ''}
                        onChange={(e) => {
                          const [orderId, itemId] = e.target.value.split('::');
                          const order = myOrders?.find(o => o._id === orderId);
                          const item = order?.orderItems?.find(i => i._id === itemId);
                          setSelectedOrderItem(item ? { ...item, orderId } : null);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500"
                      >
                        <option value="">Select an item</option>
                        {myOrders?.filter(o => o.isDelivered).map(order =>
                          order.orderItems?.map(item => (
                            <option key={item._id} value={`${order._id}::${item._id}`}>
                              {item.name} (Order: {order._id.slice(-6)})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Reason</label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500"
                      >
                        <option value="">Select a reason</option>
                        <option value="Defective or damaged">Defective or damaged</option>
                        <option value="Wrong item sent">Wrong item sent</option>
                        <option value="Not as described">Not as described</option>
                        <option value="No longer needed">No longer needed</option>
                        <option value="Better price available">Better price available</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Details (optional)</label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500 resize-none"
                        placeholder="Tell us more about the issue..."
                      />
                    </div>

                    <Button type="submit" variant="primary" size="full">
                      Submit Return Request
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <FaShieldAlt className="text-gray-300 mx-auto mb-3" size={40} />
                <h3 className="font-bold text-gray-900 mb-2">Sign in to return items</h3>
                <p className="text-xs text-gray-500 mb-4">You need to be logged in to initiate a return</p>
                <Button to="/login" variant="action" size="md" className="rounded-full w-full">
                  Sign In
                </Button>
              </div>
            )}

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Need help?</h3>
              <p className="text-xs text-gray-600 mb-3">Contact our support team for any return-related questions.</p>
              <Link to="/contact" className="text-sm text-orange-600 hover:underline font-bold no-underline">Contact Us →</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReturnsPolicy;
