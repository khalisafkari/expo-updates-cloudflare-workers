# **expo-updates-cloudflare-workers**

A custom server for Expo applications using **Cloudflare Workers** to handle over-the-air (OTA) updates more quickly and efficiently.

This project is designed to:
- Leverage the **speed** and **scalability** of Cloudflare Workers.
- Host and serve application update files.
- Maintain integration with **Expo Updates** service.
- **Avoid limitations imposed by platforms**, such as the 1,000 MAU (Monthly Active Users) cap, enabling it to serve a larger number of users without restrictions.
- Utilize two Cloudflare database models, **KV** and **D1**, for efficient and scalable data storage.
- **Good news**: Cloudflare offers both of these database models for **free**! If the provided resources are not enough, you have the option to **upgrade**. However, for apps with more than 1,000 daily active users, Cloudflare's provided resources are usually sufficient, depending on how the resources are used.

**Note**: This project is developed using **Bun version 1.2**. To avoid potential issues, I highly recommend using Bun as the runtime for this project.

---

## 🚧 **Project Status**
This project is **still under development** and may undergo significant changes.

Contributions and feedback are greatly appreciated to help improve the functionality of this project!

---

## 📋 **Key Features**
- **Fast OTA Updates**: Provides Expo application updates with low latency.
- **Cloudflare Workers**: Leverages serverless architecture for faster and cost-effective operations.
- **Expo Updates Integration**: Ensures compatibility with Expo's update system.
- **Unlimited Scalability**: Not limited by Monthly Active Users (MAU) caps.
- **Cloudflare KV and D1 Databases**: Utilizes two Cloudflare database models for efficient and scalable data storage, with free and upgrade options.

---

## 📌 **Notes**
If you encounter bugs or have suggestions, feel free to open an issue or submit a pull request!

**Happy coding!** 🎉
