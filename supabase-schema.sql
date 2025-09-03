-- Canal Mercado Database Schema
-- Supabase SQL file

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables

-- Markets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('tv', 'camera')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbacks table
CREATE TABLE playbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audiences table (for future use)
CREATE TABLE audiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    visitors INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    summary_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'client', 'market')),
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_devices_market_id ON devices(market_id);
CREATE INDEX idx_playbacks_campaign_id ON playbacks(campaign_id);
CREATE INDEX idx_playbacks_device_id ON playbacks(device_id);
CREATE INDEX idx_playbacks_date ON playbacks(date);
CREATE INDEX idx_audiences_device_id ON audiences(device_id);
CREATE INDEX idx_audiences_date ON audiences(date);
CREATE INDEX idx_reports_campaign_id ON reports(campaign_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_market_id ON user_roles(market_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Markets policies
CREATE POLICY "Markets are viewable by everyone" ON markets
    FOR SELECT USING (true);

CREATE POLICY "Markets are insertable by admins only" ON markets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Markets are updatable by admins only" ON markets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Markets are deletable by admins only" ON markets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Devices policies
CREATE POLICY "Devices are viewable by admins and market users" ON devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'market' AND market_id = devices.market_id
        )
    );

CREATE POLICY "Devices are insertable by admins only" ON devices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Devices are updatable by admins only" ON devices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Devices are deletable by admins only" ON devices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Campaigns policies
CREATE POLICY "Campaigns are viewable by admins, clients (their own), and markets" ON campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'client' AND user_id::text = campaigns.client
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'market'
        )
    );

CREATE POLICY "Campaigns are insertable by admins only" ON campaigns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Campaigns are updatable by admins only" ON campaigns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Campaigns are deletable by admins only" ON campaigns
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Playbacks policies
CREATE POLICY "Playbacks are viewable by admins, clients (their campaigns), and markets (their devices)" ON playbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN campaigns c ON c.id = playbacks.campaign_id
            WHERE ur.user_id = auth.uid() AND ur.role = 'client' AND ur.user_id::text = c.client
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN devices d ON d.id = playbacks.device_id
            WHERE ur.user_id = auth.uid() AND ur.role = 'market' AND ur.market_id = d.market_id
        )
    );

CREATE POLICY "Playbacks are insertable by admins and markets (their devices)" ON playbacks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN devices d ON d.id = playbacks.device_id
            WHERE ur.user_id = auth.uid() AND ur.role = 'market' AND ur.market_id = d.market_id
        )
    );

-- Audiences policies
CREATE POLICY "Audiences are viewable by admins and markets (their devices)" ON audiences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN devices d ON d.id = audiences.device_id
            WHERE ur.user_id = auth.uid() AND ur.role = 'market' AND ur.market_id = d.market_id
        )
    );

CREATE POLICY "Audiences are insertable by admins and markets (their devices)" ON audiences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN devices d ON d.id = audiences.device_id
            WHERE ur.user_id = auth.uid() AND ur.role = 'market' AND ur.market_id = d.market_id
        )
    );

-- Reports policies
CREATE POLICY "Reports are viewable by admins, clients (their campaigns), and markets" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN campaigns c ON c.id = reports.campaign_id
            WHERE ur.user_id = auth.uid() AND ur.role = 'client' AND ur.user_id::text = c.client
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'market'
        )
    );

CREATE POLICY "Reports are insertable by admins only" ON reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- User roles policies
CREATE POLICY "User roles are viewable by admins and own user" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        user_id = auth.uid()
    );

CREATE POLICY "User roles are insertable by admins only" ON user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "User roles are updatable by admins only" ON user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insert sample data for testing
INSERT INTO markets (name, city) VALUES 
    ('Plaza Central', 'Ciudad de México'),
    ('Mall del Norte', 'Monterrey'),
    ('Centro Comercial Sur', 'Guadalajara');

INSERT INTO devices (market_id, type, name) VALUES 
    ((SELECT id FROM markets WHERE name = 'Plaza Central'), 'tv', 'TV Principal - Entrada'),
    ((SELECT id FROM markets WHERE name = 'Plaza Central'), 'tv', 'TV Secundaria - Pasillo'),
    ((SELECT id FROM markets WHERE name = 'Mall del Norte'), 'tv', 'TV Norte - Atrio'),
    ((SELECT id FROM markets WHERE name = 'Centro Comercial Sur'), 'camera', 'Cámara Entrada Principal');

INSERT INTO campaigns (name, client, start_date, end_date) VALUES 
    ('Campaña Coca-Cola Verano', 'coca-cola-001', '2024-06-01', '2024-08-31'),
    ('Promoción Nike Deportes', 'nike-002', '2024-07-01', '2024-09-30'),
    ('Oferta Samsung TV', 'samsung-003', '2024-08-01', '2024-10-31');

-- Insert sample playbacks
INSERT INTO playbacks (campaign_id, device_id, date, time, duration) VALUES 
    ((SELECT id FROM campaigns WHERE name = 'Campaña Coca-Cola Verano'), 
     (SELECT id FROM devices WHERE name = 'TV Principal - Entrada'), 
     '2024-06-15', '10:00:00', 30),
    ((SELECT id FROM campaigns WHERE name = 'Campaña Coca-Cola Verano'), 
     (SELECT id FROM devices WHERE name = 'TV Secundaria - Pasillo'), 
     '2024-06-15', '10:30:00', 30),
    ((SELECT id FROM campaigns WHERE name = 'Promoción Nike Deportes'), 
     (SELECT id FROM devices WHERE name = 'TV Norte - Atrio'), 
     '2024-07-15', '14:00:00', 45);

-- Insert sample user roles (you'll need to replace the user IDs with actual Supabase user IDs)
-- INSERT INTO user_roles (user_id, role, market_id) VALUES 
--     ('your-admin-user-id', 'admin', NULL),
--     ('your-client-user-id', 'client', NULL),
--     ('your-market-user-id', 'market', (SELECT id FROM markets WHERE name = 'Plaza Central'));
