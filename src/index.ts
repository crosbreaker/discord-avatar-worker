const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
	"Access-Control-Max-Age": "86400",
};

export default {
	async fetch(request): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);
		const discordId = url.pathname.slice(1);

		if (!discordId || !/^\d+$/.test(discordId)) {
			return new Response("Invalid Discord ID", { status: 400, headers: corsHeaders });
		}

		const lanyardRes = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
		if (!lanyardRes.ok) {
			return new Response("Failed to fetch user from Lanyard", { status: 502, headers: corsHeaders });
		}

		const lanyard: any = await lanyardRes.json();
		const avatarHash = lanyard?.data?.discord_user?.avatar;

		if (!avatarHash) {
			return new Response("Avatar not found", { status: 404, headers: corsHeaders });
		}

		const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.jpg?size=1024`;
		const avatarRes = await fetch(avatarUrl);

		if (!avatarRes.ok) {
			return new Response("Failed to fetch avatar image", { status: 502, headers: corsHeaders });
		}

		return new Response(avatarRes.body, {
			headers: {
				...corsHeaders,
				"Content-Type": avatarRes.headers.get("Content-Type") || "image/jpeg",
				"Cache-Control": "public, max-age=300",
			},
		});
	},
} satisfies ExportedHandler;
