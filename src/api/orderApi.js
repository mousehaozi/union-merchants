import request from "@/utils/request.js";

/**
 * 商家订单分页
 * @param {Object} params - { pageNum, pageSize, status, receiverName, receiverPhone, userName }
 */
export const getMerchantOrderPage = (params) => {
  return request.get("/merchant/orders/page", { params });
};

/**
 * 商家待发货订单分页
 * @param {Object} params - { pageNum, pageSize, receiverName, receiverPhone, userName }
 */
export const getWaitShipOrderPage = (params) => {
  return request.get("/merchant/orders/wait-ship/page", { params });
};

/**
 * 商家订单详情
 * @param {string} orderNo - 订单编号
 */
export const getMerchantOrderDetail = (orderNo) => {
  return request.get(`/merchant/orders/${orderNo}`);
};

/**
 * 订单物流查询
 * @param {string} orderNo - 订单编号
 */
export const getMerchantOrderLogistics = (orderNo) => {
  return request.get(`/merchant/orders/${orderNo}/logistics`);
};

/**
 * 查询同地址待发货订单
 * @param {Object} params - { addressId }
 */
export const getSameAddressWaitShipOrders = (params) => {
  return request.get("/merchant/orders/wait-ship/same-address", { params });
};

/**
 * 商家发货
 * @param {Object} data - { orderList, trackingList, remark }
 */
export const shipMerchantOrders = (data) => {
  return request.post("/merchant/orders/ship", data);
};
