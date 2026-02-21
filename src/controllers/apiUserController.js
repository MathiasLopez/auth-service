import UserService from "../services/userService.js";

export const users = async (req, res) => {
    try {
        const users = await UserService.getUsers({ tenantId: req.tenantId });
        return res.json(users);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'An error occurred while retrieving users.'
        });
    }
};
