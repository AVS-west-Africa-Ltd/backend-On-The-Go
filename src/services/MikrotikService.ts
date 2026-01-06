// services/routerOsService.ts
import { RouterOSClient } from 'sy5-routeros-client';
import { randomCharacters } from '../utils/helpers';
import { NetworkRouter } from '../models/NetworkRouter';
import { TicketProfile } from '../models/TicketProfile';
import { RouterCredentials } from '../interfaces/mikrotik.interface';

export const getSystemResource = async (credentials: RouterCredentials) => {
  let client: RouterOSClient | undefined;
  try {
    client = new RouterOSClient(credentials);
    const router = await client.connect();
    const systemInfo = await router.menu("/system/resource").getOnly();

    if (!systemInfo) throw new Error("Failed to fetch system resource.");
    return systemInfo;
  } catch (error: any) {
    console.error(error);
    throw new Error("Failed to fetch system resource.");
  } finally {
    if (client) await client.close();
  }
};

export const fetchRouterProfile = async (credentials: RouterCredentials) => {
  let client: RouterOSClient | undefined;
  try {
    client = new RouterOSClient(credentials);
    const router = await client.connect();
    const profiles = await router.menu("/tool/user-manager/profile").getAll();

    if (!profiles) throw new Error("Failed to fetch profiles.");
    return profiles;
  } catch (error: any) {
    console.error(error);
    throw new Error("Failed to fetch profiles.");
  } finally {
    if (client) await client.close();
  }
};

export const generateTicket = async (ticketProfile: TicketProfile) => {
  let client: RouterOSClient | undefined;
  try {
    // Fetch router from DB
    const networkRouter = await NetworkRouter.findOne({
      where: { id: ticketProfile.routerId },
    });
    if (!networkRouter) throw new Error("Failed to fetch network router.");

    const credentials: RouterCredentials = {
      host: networkRouter.host,
      user: networkRouter.username,
      password: networkRouter.password,
    };

    client = new RouterOSClient(credentials);
    const router = await client.connect();

    // Add new user in User Manager
    const userManagerMenu = router.menu("/tool/user-manager/user");
    const ticketInfo = { username: randomCharacters(6), password: randomCharacters(6) };
    const ticket = await userManagerMenu.add({
      ...ticketInfo,
      customer: ticketProfile.owner,
    });

    // Activate profile
    await userManagerMenu.exec("create-and-activate-profile", {
      customer: ticketProfile.owner,
      profile: ticketProfile.name,
      numbers: ticket.id,
    });

    return ticketInfo;
  } catch (error: any) {
    console.error("Ticket generation failed:", error);
    throw new Error("Failed to generate ticket.");
  } finally {
    if (client) await client.close();
  }
};

export const connector = async (credentials: { host: string; user: string; password: string }) => {
  const client = new RouterOSClient(credentials);
  const router = await client.connect();
  return { router, client };
};