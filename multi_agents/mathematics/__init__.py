"""
mathematics department - agent modules are imported lazily and directly by
dotted path (see backend/services/agent_catalog.py), so this package no
longer eagerly imports individual tutor files here. The previous version
of this file referenced files/classes that didn't match what's actually
on disk and broke every import under this subject.
"""
